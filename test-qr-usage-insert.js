const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testQRUsageInsert() {
  console.log('🔍 Testing qr_usage table insert to discover column names...\n');
  
  try {
    // Try different possible column names
    const testInserts = [
      {
        name: 'qr_code_secret',
        data: { session_id: 'test', qr_code_secret: 'test', used_by: 'test', used_at: new Date().toISOString(), device_fingerprint: 'test' }
      },
      {
        name: 'qr_code_data', 
        data: { session_id: 'test', qr_code_data: 'test', used_by: 'test', used_at: new Date().toISOString(), device_fingerprint: 'test' }
      },
      {
        name: 'qr_data',
        data: { session_id: 'test', qr_data: 'test', used_by: 'test', used_at: new Date().toISOString(), device_fingerprint: 'test' }
      }
    ];
    
    for (const test of testInserts) {
      console.log(`\n🧪 Testing with column name: ${test.name}`);
      const { data, error } = await supabaseAdmin
        .from('qr_usage')
        .insert(test.data);
      
      if (error) {
        console.log(`❌ Error with ${test.name}:`, error.message);
        // Look for column name hints in the error message
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`   → Column ${test.name} does not exist`);
        } else if (error.message.includes('column') && error.message.includes('of relation')) {
          console.log(`   → Different column name issue`);
        }
      } else {
        console.log(`✅ Success with ${test.name}!`);
        // Clean up the test record
        await supabaseAdmin.from('qr_usage').delete().eq('session_id', 'test');
        break;
      }
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

testQRUsageInsert();
