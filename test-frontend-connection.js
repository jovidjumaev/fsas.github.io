const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testFrontendConnection() {
  console.log('🌐 Testing frontend connection to Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔗 Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log(`❌ Auth connection failed: ${authError.message}`);
    } else {
      console.log('✅ Auth connection successful');
    }
    
    console.log('\n📊 Testing table access...');
    
    // Test each table
    const tables = [
      'user_profiles',
      'courses', 
      'class_sessions',
      'attendance_records',
      'qr_code_usage'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(5);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Accessible (${data.length} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Frontend connection test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Visit http://localhost:3000/debug-page to test the frontend');
    console.log('2. The database is ready for data insertion');
    console.log('3. You can now test the full application');
    
  } catch (error) {
    console.log(`❌ Error testing frontend connection: ${error.message}`);
  }
}

testFrontendConnection();
