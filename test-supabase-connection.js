const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📋 Environment Variables:');
  console.log(`   URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing required environment variables!');
    console.log('Please check your .env.local file.\n');
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('🔗 Supabase client created successfully\n');

    // Test basic connection
    console.log('🧪 Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log(`❌ Auth test failed: ${authError.message}\n`);
    } else {
      console.log('✅ Auth connection successful\n');
    }

    // Test database connection
    console.log('🧪 Testing database connection...');
    const { data: dbData, error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (dbError) {
      console.log(`❌ Database test failed: ${dbError.message}`);
      console.log('This might be expected if the schema is not yet applied.\n');
    } else {
      console.log('✅ Database connection successful\n');
    }

    // Test if we can access the project
    console.log('🧪 Testing project access...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      console.log('✅ Project is accessible\n');
    } else {
      console.log(`❌ Project access failed: ${response.status} ${response.statusText}\n`);
    }

    console.log('🎉 Supabase connection test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. If any tests failed, check your Supabase project settings');
    console.log('2. Apply the database schema from database/schema.sql');
    console.log('3. Test the application with: npm run dev');

  } catch (error) {
    console.log(`❌ Connection test failed: ${error.message}\n`);
    console.log('Please check your Supabase project configuration.');
  }
}

testSupabaseConnection();
