const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function executeCleanup() {
  console.log('🧹 Starting database cleanup...\n');
  
  try {
    // Read the cleanup SQL file
    const cleanupSQL = fs.readFileSync('cleanup-old-tables.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = cleanupSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('drop table')) {
        const tableName = statement.match(/drop table if exists (\w+)/i)?.[1];
        console.log(`🗑️  Executing: ${statement}`);
        
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
        } else {
          console.log(`✅ Successfully dropped table: ${tableName}`);
        }
      }
    }
    
    console.log('\n🔍 Verifying cleanup...');
    
    // Check if old tables still exist
    const oldTables = ['user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage'];
    const remainingOldTables = [];
    
    for (const tableName of oldTables) {
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .select('*', { head: true });
        
        if (!error) {
          remainingOldTables.push(tableName);
        }
      } catch (err) {
        // Table doesn't exist, which is what we want
      }
    }
    
    if (remainingOldTables.length === 0) {
      console.log('✅ All old tables successfully removed!');
    } else {
      console.log('⚠️  Some old tables still exist:', remainingOldTables);
    }
    
    // Check new tables are still intact
    console.log('\n🔍 Verifying new tables are intact...');
    const newTables = ['users', 'students', 'professors', 'classes', 'departments', 'academic_periods'];
    
    for (const tableName of newTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Error accessing ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.log(`❌ Exception accessing ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

executeCleanup();
