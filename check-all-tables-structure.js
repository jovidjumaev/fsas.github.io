const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkAllTables() {
  console.log('🔍 Checking all table structures...\n');
  
  const tables = ['users', 'students', 'professors', 'classes', 'sessions', 'attendance', 'qr_usage', 'departments', 'academic_periods', 'enrollments', 'notifications', 'attendance_analytics'];
  
  for (const tableName of tables) {
    try {
      console.log(`\n📋 ${tableName.toUpperCase()} table structure:`);
      console.log('=' .repeat(40));
      
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Table ${tableName} does not exist`);
        } else {
          console.log(`❌ Error: ${error.message}`);
        }
      } else if (data && data.length > 0) {
        const record = data[0];
        Object.keys(record).forEach(key => {
          console.log(`- ${key}: ${typeof record[key]} (${record[key]})`);
        });
      } else {
        console.log(`📭 Table ${tableName} is empty`);
      }
    } catch (err) {
      console.log(`❌ Exception for ${tableName}: ${err.message}`);
    }
  }
}

checkAllTables();
