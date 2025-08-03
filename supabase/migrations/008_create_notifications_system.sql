-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('automation_failed', 'automation_success', 'automation_started', 'system_alert', 'maintenance', 'update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_read_at CHECK (read_at IS NULL OR read_at >= created_at)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{
    "automation_failed": true,
    "automation_success": false,
    "automation_started": false,
    "system_alert": true,
    "maintenance": true,
    "update": true
  }',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_priority ON public.notifications(priority) WHERE priority IN ('high', 'urgent');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create notification preferences
CREATE TRIGGER create_notification_preferences_on_user_create
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences_for_user();

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notifications"
  ON public.notifications
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notification preferences"
  ON public.notification_preferences
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.notifications
    WHERE user_id = p_user_id
      AND read = false
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all notifications as read
    UPDATE public.notifications
    SET read = true, read_at = NOW()
    WHERE user_id = p_user_id
      AND read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE public.notifications
    SET read = true, read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND read = false;
  END IF;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title TEXT,
  p_message TEXT,
  p_priority VARCHAR(20) DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
BEGIN
  -- Check user preferences
  SELECT * INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  -- Check if this notification type is enabled
  IF v_preferences.notification_types ? p_type AND 
     (v_preferences.notification_types->p_type)::boolean = true THEN
    -- Create the notification
    INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
    VALUES (p_user_id, p_type, p_title, p_message, p_priority, p_metadata)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add notification creation for automation status changes
CREATE OR REPLACE FUNCTION notify_automation_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type VARCHAR(50);
  v_priority VARCHAR(20);
BEGIN
  -- Only notify on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determine notification type and content
    CASE NEW.status
      WHEN 'Error' THEN
        v_type := 'automation_failed';
        v_title := 'Automation Failed';
        v_message := format('Automation "%s" has encountered an error', NEW.name);
        v_priority := 'high';
      WHEN 'Running' THEN
        v_type := 'automation_started';
        v_title := 'Automation Started';
        v_message := format('Automation "%s" is now running', NEW.name);
        v_priority := 'normal';
      WHEN 'Stopped' THEN
        IF OLD.status = 'Running' AND NEW.success_rate >= 95 THEN
          v_type := 'automation_success';
          v_title := 'Automation Completed Successfully';
          v_message := format('Automation "%s" completed with %.1f%% success rate', NEW.name, NEW.success_rate);
          v_priority := 'low';
        END IF;
      ELSE
        -- No notification for other status changes
        RETURN NEW;
    END CASE;
    
    -- Create notification if type is set
    IF v_type IS NOT NULL THEN
      PERFORM create_notification(
        NEW.user_id,
        v_type,
        v_title,
        v_message,
        v_priority,
        jsonb_build_object(
          'automation_id', NEW.id,
          'automation_name', NEW.name,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automation status notifications
CREATE TRIGGER notify_on_automation_status_change
  AFTER UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION notify_automation_status_change();

-- Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR, TEXT, TEXT, VARCHAR, JSONB) TO authenticated;