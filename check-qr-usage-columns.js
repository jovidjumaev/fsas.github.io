const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkQRUsageColumns() {
  console.log('🔍 Checking qr_usage table columns...\n');
  
  try {
    // Try to insert a dummy record to see what columns are expected
    const { data, error } = await supabaseAdmin
      .from('qr_usage')
      .select('*')
      .limit(0);
    
    if (error) {
      console.log('❌ Error accessing qr_usage table:', error.message);
      
      // Try to get table info using a different approach
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .rpc('exec_sql', { 
          sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'qr_usage' ORDER BY ordinal_position;" 
        });
      
      if (tableError) {
        console.log('❌ Could not get table info:', tableError.message);
      } else {
        console.log('📋 qr_usage table columns:');
        console.log('==========================');
        if (tableInfo && tableInfo.length > 0) {
          tableInfo.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}`);
          });
        } else {
          console.log('No columns found or table does not exist');
        }
      }
    } else {
      console.log('✅ qr_usage table accessible');
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

checkQRUsageColumns();
