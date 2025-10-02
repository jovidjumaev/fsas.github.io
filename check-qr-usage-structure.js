const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkQRUsageStructure() {
  console.log('🔍 Checking qr_usage table structure...\n');
  
  try {
    // Get a sample qr_usage record to see the structure
    const { data, error } = await supabaseAdmin
      .from('qr_usage')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing qr_usage table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 qr_usage table structure:');
      console.log('============================');
      const record = data[0];
      Object.keys(record).forEach(key => {
        console.log(`- ${key}: ${typeof record[key]} (${record[key]})`);
      });
    } else {
      console.log('📭 qr_usage table is empty, checking schema...');
      
      // Try to get table schema information
      const { data: schemaData, error: schemaError } = await supabaseAdmin
        .rpc('get_table_columns', { table_name: 'qr_usage' });
      
      if (schemaError) {
        console.log('❌ Could not get schema info:', schemaError.message);
      } else {
        console.log('📋 Table columns:', schemaData);
      }
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

checkQRUsageStructure();
