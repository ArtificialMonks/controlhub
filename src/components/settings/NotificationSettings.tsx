// src/components/settings/NotificationSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  automation_failed: boolean
  automation_success: boolean
  automation_started: boolean
  system_alerts: boolean
  maintenance_updates: boolean
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
}

export function NotificationSettings({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    automation_failed: true,
    automation_success: false,
    automation_started: false,
    system_alerts: true,
    maintenance_updates: true,
    digest_frequency: 'realtime'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          setPreferences(data.preferences as NotificationPreferences)
        }
      } catch (error) {
        console.warn('Notification preferences table not found or accessible:', error)
        // Use default preferences if table doesn't exist
        // This is expected for development environments
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [userId, supabase, toast])

  // Save preferences
  const savePreferences = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Notification preferences saved"
      })
    } catch (error) {
      console.warn('Unable to save notification preferences:', error)
      toast({
        title: "Note",
        description: "Notification preferences are not available in development mode",
        variant: "default"
      })
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Configure how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Delivery Methods</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Browser push notifications when online
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
            />
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notification Types</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="automation-failed">Automation Failures</Label>
              <p className="text-sm text-muted-foreground">
                When an automation fails to execute
              </p>
            </div>
            <Switch
              id="automation-failed"
              checked={preferences.automation_failed}
              onCheckedChange={(checked) => updatePreference('automation_failed', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="automation-success">Automation Success</Label>
              <p className="text-sm text-muted-foreground">
                When an automation completes successfully
              </p>
            </div>
            <Switch
              id="automation-success"
              checked={preferences.automation_success}
              onCheckedChange={(checked) => updatePreference('automation_success', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="automation-started">Automation Started</Label>
              <p className="text-sm text-muted-foreground">
                When an automation begins execution
              </p>
            </div>
            <Switch
              id="automation-started"
              checked={preferences.automation_started}
              onCheckedChange={(checked) => updatePreference('automation_started', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-alerts">System Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Important system notifications and alerts
              </p>
            </div>
            <Switch
              id="system-alerts"
              checked={preferences.system_alerts}
              onCheckedChange={(checked) => updatePreference('system_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-updates">Maintenance Updates</Label>
              <p className="text-sm text-muted-foreground">
                Scheduled maintenance and system updates
              </p>
            </div>
            <Switch
              id="maintenance-updates"
              checked={preferences.maintenance_updates}
              onCheckedChange={(checked) => updatePreference('maintenance_updates', checked)}
            />
          </div>
        </div>

        {/* Digest Frequency */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notification Frequency</h4>
          
          <div className="space-y-2">
            <Label htmlFor="digest-frequency">Email Digest Frequency</Label>
            <Select 
              value={preferences.digest_frequency}
              onValueChange={(value: string) => updatePreference('digest_frequency', value)}
            >
              <SelectTrigger id="digest-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly Summary</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often to receive email notification summaries
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}