// Test script to verify settings save functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfrqnqyjvdrzoqhqxqzi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcnFucXl2ZHJ6b3FocXhxemkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDE2NzM0NCwiZXhwIjoyMDQ5NzQzMzQ0fQ.ELN9cd2A9uqBCm7Ld24xvDEArmHxz8g0EiMxrxz0Tko';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSettingsSave() {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Not authenticated. Please log in first.');
      return;
    }
    
    console.log('Current user:', user.email);
    console.log('User ID:', user.id);
    
    // Test saving profile settings
    const testSettings = {
      displayName: 'Test User',
      bio: 'Testing settings save',
      timezone: 'America/New_York',
      language: 'en',
      teamMode: 'lite'
    };
    
    console.log('\nAttempting to save profile settings...');
    
    const { data, error } = await supabase
      .from('user_settings_v2')
      .upsert({
        user_id: user.id,
        category: 'profile',
        settings: testSettings
      }, {
        onConflict: 'user_id,category'
      })
      .select();
    
    if (error) {
      console.error('Error saving settings:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Settings saved successfully!');
      console.log('Saved data:', data);
    }
    
    // Try to read back the settings
    console.log('\nReading settings back...');
    const { data: readData, error: readError } = await supabase
      .from('user_settings_v2')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', 'profile')
      .single();
    
    if (readError) {
      console.error('Error reading settings:', readError);
    } else {
      console.log('Settings read successfully:', readData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testSettingsSave();