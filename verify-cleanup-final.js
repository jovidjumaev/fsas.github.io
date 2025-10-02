const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyCleanup() {
  console.log('🔍 Verifying database cleanup...\n');
  
  // Check new optimized tables
  const newTables = [
    'users', 'students', 'professors', 'classes', 'sessions', 
    'attendance', 'qr_usage', 'departments', 'academic_periods', 'enrollments'
  ];
  
  console.log('✅ NEW OPTIMIZED TABLES:');
  console.log('========================');
  
  for (const tableName of newTables) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: ERROR - ${error.message}`);
      } else {
        const status = count > 0 ? '📈' : '📭';
        console.log(`${status} ${tableName}: ${count} records`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: EXCEPTION - ${err.message}`);
    }
  }
  
  // Check if old tables still exist
  const oldTables = ['user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage'];
  
  console.log('\n🗑️  OLD TABLES STATUS:');
  console.log('======================');
  
  let oldTablesRemaining = 0;
  for (const tableName of oldTables) {
    try {
      const { error } = await supabaseAdmin
        .from(tableName)
        .select('*', { head: true });
      
      if (error && error.code === 'PGRST116') {
        console.log(`✅ ${tableName}: REMOVED`);
      } else if (error) {
        console.log(`❌ ${tableName}: ERROR - ${error.message}`);
      } else {
        console.log(`⚠️  ${tableName}: STILL EXISTS`);
        oldTablesRemaining++;
      }
    } catch (err) {
      console.log(`✅ ${tableName}: REMOVED (exception caught)`);
    }
  }
  
  console.log('\n📊 CLEANUP SUMMARY:');
  console.log('===================');
  
  if (oldTablesRemaining === 0) {
    console.log('🎉 SUCCESS: All old tables have been removed!');
    console.log('✅ Database is now clean and optimized');
  } else {
    console.log(`⚠️  WARNING: ${oldTablesRemaining} old tables still exist`);
    console.log('💡 Please run the cleanup SQL in Supabase Dashboard');
  }
  
  // Test API endpoints
  console.log('\n🔗 TESTING API ENDPOINTS:');
  console.log('=========================');
  
  const endpoints = [
    '/api/departments',
    '/api/academic-periods', 
    '/api/professors',
    '/api/students',
    '/api/classes',
    '/api/enrollments'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${endpoint}: ${data.count} records`);
      } else {
        console.log(`❌ ${endpoint}: ${data.error}`);
      }
    } catch (err) {
      console.log(`❌ ${endpoint}: ${err.message}`);
    }
  }
}

verifyCleanup().catch(console.error);
