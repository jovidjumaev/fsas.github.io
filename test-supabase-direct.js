const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseDirect() {
  console.log('🔍 Testing Supabase connection directly...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📊 Environment Variables:');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Present' : 'Missing');
  console.log('');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test auth
    console.log('🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('❌ Auth Error:', authError.message);
    } else {
      console.log('✅ Auth working');
    }

    // Test courses table
    console.log('\n📚 Testing courses table...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);

    if (coursesError) {
      console.log('❌ Courses Error:', coursesError.message);
    } else {
      console.log('✅ Courses table accessible');
      console.log('📊 Found courses:', coursesData.length);
      if (coursesData.length > 0) {
        console.log('📋 Course data:');
        coursesData.forEach((course, index) => {
          console.log(`  ${index + 1}. ${course.course_code} - ${course.course_name}`);
        });
      }
    }

    // Test user_profiles table
    console.log('\n👥 Testing user_profiles table...');
    const { data: usersData, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (usersError) {
      console.log('❌ Users Error:', usersError.message);
    } else {
      console.log('✅ User profiles table accessible');
      console.log('📊 Found users:', usersData.length);
      if (usersData.length > 0) {
        console.log('📋 User data:');
        usersData.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.role})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Connection Error:', error.message);
  }
}

testSupabaseDirect();
