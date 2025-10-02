const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTableStructure() {
  console.log('🔍 Checking table structure...\n');
  
  try {
    // Try to get table structure using a direct query
    const { data, error } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns 
          WHERE table_name IN ('qr_usage', 'qr_code_usage')
          ORDER BY table_name, ordinal_position;
        ` 
      });
    
    if (error) {
      console.log('❌ Error getting table structure:', error.message);
      
      // Try a simpler approach - just try to select from the table
      console.log('\n🔍 Trying to select from qr_usage table...');
      const { data: selectData, error: selectError } = await supabaseAdmin
        .from('qr_usage')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log('❌ Select error:', selectError.message);
      } else {
        console.log('✅ qr_usage table accessible, but empty');
      }
      
    } else {
      console.log('📋 Table structure:');
      console.log('==================');
      if (data && data.length > 0) {
        data.forEach(row => {
          console.log(`${row.table_name}.${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
      } else {
        console.log('No tables found with names qr_usage or qr_code_usage');
      }
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

checkTableStructure();
