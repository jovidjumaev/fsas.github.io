const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseService() {
  console.log('🔍 Testing Supabase with Service Role Key...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Test courses table with service role
    console.log('📚 Testing courses table with service role...');
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

    // Test user_profiles table with service role
    console.log('\n👥 Testing user_profiles table with service role...');
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

testSupabaseService();
