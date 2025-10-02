const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkAttendanceStructure() {
  console.log('🔍 Checking attendance table structure...\n');
  
  try {
    // Try to get a sample record to see the structure
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing attendance table:', error.message);
      
      // Try to insert a test record to see what columns are expected
      console.log('\n🧪 Testing attendance table columns...');
      const testData = { test: 'value' };
      const { error: insertError } = await supabaseAdmin
        .from('attendance')
        .insert(testData);
      
      if (insertError) {
        console.log('📝 Insert error (shows expected columns):', insertError.message);
      }
    } else {
      console.log('📋 Attendance table structure:');
      console.log('==============================');
      if (data && data.length > 0) {
        const record = data[0];
        Object.keys(record).forEach(key => {
          console.log(`- ${key}: ${typeof record[key]} (${record[key]})`);
        });
      } else {
        console.log('📭 Attendance table is empty');
        
        // Try to insert a test record to see what columns are expected
        console.log('\n🧪 Testing attendance table columns...');
        const testData = { test: 'value' };
        const { error: insertError } = await supabaseAdmin
          .from('attendance')
          .insert(testData);
        
        if (insertError) {
          console.log('📝 Insert error (shows expected columns):', insertError.message);
        }
      }
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

checkAttendanceStructure();
