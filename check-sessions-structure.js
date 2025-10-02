const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSessionsStructure() {
  console.log('🔍 Checking sessions table structure...\n');
  
  try {
    // Get a sample session to see the structure
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing sessions table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Sessions table structure:');
      console.log('============================');
      const session = data[0];
      Object.keys(session).forEach(key => {
        console.log(`- ${key}: ${typeof session[key]} (${session[key]})`);
      });
    } else {
      console.log('📭 Sessions table is empty, checking schema...');
      
      // Try to get table schema information
      const { data: schemaData, error: schemaError } = await supabaseAdmin
        .rpc('get_table_columns', { table_name: 'sessions' });
      
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

checkSessionsStructure();
