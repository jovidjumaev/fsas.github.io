const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testExistingTables() {
  console.log('🔍 Testing existing Supabase tables...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test each table that should exist
    const tables = [
      'user_profiles',
      'courses', 
      'class_sessions',
      'attendance_records',
      'qr_code_usage'
    ];
    
    console.log('📊 Checking for existing tables:\n');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Table exists (${data.length} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Test if we can create a simple test record
    console.log('\n🧪 Testing data insertion...');
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: 'test-user-id',
          student_id: 'TEST001',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: 'student'
        })
        .select();
      
      if (error) {
        console.log(`❌ Insert test failed: ${error.message}`);
      } else {
        console.log(`✅ Insert test successful: ${data.length} record created`);
        
        // Clean up test record
        await supabase
          .from('user_profiles')
          .delete()
          .eq('id', 'test-user-id');
        console.log('🧹 Test record cleaned up');
      }
    } catch (err) {
      console.log(`❌ Insert test failed: ${err.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Error testing tables: ${error.message}`);
  }
}

testExistingTables();
