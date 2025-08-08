// Comprehensive localhost + Supabase connection test
const testLocalhostSupabase = () => {
  console.log('=== LOCALHOST + SUPABASE DIAGNOSTIC ===\n');
  
  // 1. Check environment variables
  console.log('1. ENVIRONMENT VARIABLES:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  
  // 2. Check current origin
  if (typeof window !== 'undefined') {
    console.log('\n2. BROWSER ENVIRONMENT:');
    console.log('Current Origin:', window.location.origin);
    console.log('Current Host:', window.location.host);
    console.log('Current Protocol:', window.location.protocol);
  } else {
    console.log('\n2. SERVER ENVIRONMENT - Cannot check browser location');
  }
  
  // 3. Common localhost issues
  console.log('\n3. COMMON LOCALHOST ISSUES TO CHECK:');
  console.log('❌ Site URL must include http://localhost:3000 in Supabase dashboard');
  console.log('❌ Redirect URLs must include http://localhost:3000/auth/callback');
  console.log('❌ Email confirmation may not work on localhost');
  console.log('❌ CORS may block requests from localhost');
  console.log('❌ Some auth providers disable localhost');
  
  console.log('\n4. REQUIRED SUPABASE DASHBOARD SETTINGS:');
  console.log('Navigate to: https://supabase.com/dashboard/project/xxttsckupjbvvhrykprf/auth/url-configuration');
  console.log('');
  console.log('Site URL should be: http://localhost:3000');
  console.log('Redirect URLs should include:');
  console.log('  - http://localhost:3000/auth/callback');
  console.log('  - https://controlhub.artificialmonks.com/auth/callback');
  
  console.log('\n5. DEBUGGING STEPS:');
  console.log('a) Check browser Network tab for failed requests');
  console.log('b) Look for CORS errors in console');
  console.log('c) Check if requests reach Supabase at all');
  console.log('d) Verify the auth URL being generated');
  
  console.log('\n6. WORKAROUNDS IF LOCALHOST FAILS:');
  console.log('a) Use ngrok to create HTTPS tunnel');
  console.log('b) Use production URL for testing');
  console.log('c) Disable email confirmation temporarily');
  console.log('d) Use manual user creation via SQL');
};

// Run the diagnostic
testLocalhostSupabase();