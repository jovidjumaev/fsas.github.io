const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkAllTables() {
  console.log('🔍 Checking all database tables...\n');
  
  // List of all possible tables from both old and new schemas
  const tablesToCheck = [
    // New optimized schema tables
    'users', 'students', 'professors', 'classes', 'sessions', 'attendance', 'qr_usage',
    'departments', 'academic_periods', 'enrollments',
    
    // Old schema tables (should be removed)
    'user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist
          missingTables.push(tableName);
        } else {
          console.log(`❌ Error checking ${tableName}:`, error.message);
        }
      } else {
        existingTables.push({
          name: tableName,
          count: count || 0
        });
      }
    } catch (err) {
      console.log(`❌ Exception checking ${tableName}:`, err.message);
    }
  }
  
  console.log('📊 EXISTING TABLES:');
  console.log('==================');
  existingTables.forEach(table => {
    const status = table.count > 0 ? '📈' : '📭';
    console.log(`${status} ${table.name}: ${table.count} records`);
  });
  
  console.log('\n❌ MISSING TABLES:');
  console.log('==================');
  missingTables.forEach(table => {
    console.log(`❌ ${table}`);
  });
  
  // Identify old tables that should be removed
  const oldTables = existingTables.filter(table => 
    ['user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage'].includes(table.name)
  );
  
  if (oldTables.length > 0) {
    console.log('\n🗑️  OLD TABLES TO REMOVE:');
    console.log('=========================');
    oldTables.forEach(table => {
      console.log(`🗑️  ${table.name}: ${table.count} records`);
    });
  } else {
    console.log('\n✅ No old tables found - database is clean!');
  }
  
  // Check for any data in old tables
  const oldTablesWithData = oldTables.filter(table => table.count > 0);
  if (oldTablesWithData.length > 0) {
    console.log('\n⚠️  WARNING: Old tables contain data!');
    console.log('=====================================');
    oldTablesWithData.forEach(table => {
      console.log(`⚠️  ${table.name} has ${table.count} records that need to be migrated or backed up`);
    });
  }
}

checkAllTables().catch(console.error);
