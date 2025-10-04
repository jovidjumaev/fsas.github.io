require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigatePassword() {
  console.log('🔍 INVESTIGATING PASSWORD ISSUE...');

  // Get all users to see what we have
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  console.log('👥 Total users:', authUsers?.users?.length || 0);

  if (authUsers?.users) {
    authUsers.users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('📧 Email:', user.email);
      console.log('📅 Created:', user.created_at);
      console.log('📅 Last sign in:', user.last_sign_in_at);
      console.log('🔐 Provider:', user.app_metadata?.provider);
      console.log('📧 Email confirmed:', user.email_confirmed_at ? 'YES' : 'NO');
    });
  }

  // Test sign-in with the most recent user
  const recentUser = authUsers?.users?.[0];
  if (recentUser) {
    console.log(`\n🧪 Testing sign-in with most recent user: ${recentUser.email}`);
    
    // Try different passwords
    const passwords = ['password123', 'test123', 'Password123', 'PASSWORD123', '123456'];
    
    for (const password of passwords) {
      console.log(`\n🔑 Trying password: ${password}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: recentUser.email,
        password: password
      });
      
      if (data?.user) {
        console.log('✅ SUCCESS with password:', password);
        break;
      } else {
        console.log('❌ Failed:', error?.message || 'Unknown error');
      }
    }
  }

  // Test creating a new user with a known password
  console.log('\n🧪 Testing new user creation with known password...');
  const testEmail = `testuser${Date.now()}@furman.edu`;
  const testPassword = 'testpassword123';
  
  console.log('Creating user with email:', testEmail);
  console.log('Creating user with password:', testPassword);
  
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        first_name: 'Test',
        last_name: 'User',
        role: 'student'
      }
    }
  });
  
  console.log('Signup result:', signupData?.user ? 'SUCCESS' : 'FAILED');
  if (signupError) {
    console.log('Signup error:', signupError.message);
  }
  
  if (signupData?.user) {
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to sign in immediately
    console.log('\n🔑 Testing immediate sign-in with same password...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    console.log('Immediate sign-in result:', signinData?.user ? 'SUCCESS' : 'FAILED');
    if (signinError) {
      console.log('Immediate sign-in error:', signinError.message);
    }
  }
}

investigatePassword().catch(console.error);
