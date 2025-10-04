const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test auth signup
    console.log('\n2. Testing auth signup...');
    const testEmail = `test-${Date.now()}@furman.edu`;
    const testPassword = 'testpassword123';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('❌ Auth signup failed:', authError.message);
      return;
    }
    
    console.log('✅ Auth signup successful');
    console.log('User ID:', authData.user?.id);
    
    // Test user profile creation
    console.log('\n3. Testing user profile creation...');
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
        is_active: true
      });
    
    if (userError) {
      console.error('❌ User profile creation failed:', userError.message);
      return;
    }
    
    console.log('✅ User profile creation successful');
    
    // Test student profile creation
    console.log('\n4. Testing student profile creation...');
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: authData.user.id,
        student_id: `S${Date.now()}`,
        enrollment_year: 2024,
        major: 'Computer Science'
      });
    
    if (studentError) {
      console.error('❌ Student profile creation failed:', studentError.message);
      return;
    }
    
    console.log('✅ Student profile creation successful');
    
    console.log('\n🎉 All tests passed! Supabase is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
