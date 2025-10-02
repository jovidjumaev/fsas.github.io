const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyCleanup() {
  console.log('🔍 Verifying database cleanup...\n');
  
  // Check for old schema tables (should be gone)
  const oldTables = ['user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage'];
  const newTables = ['users', 'classes', 'sessions', 'attendance', 'qr_usage'];
  
  console.log('📋 Checking Old Schema Tables (should be gone):');
  let oldTablesExist = false;
  for (const table of oldTables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`  ✅ ${table} - Successfully removed`);
      } else {
        console.log(`  ❌ ${table} - Still exists (${data.length} records)`);
        oldTablesExist = true;
      }
    } catch (err) {
      console.log(`  ✅ ${table} - Successfully removed`);
    }
  }
  
  console.log('\n📋 Checking New Schema Tables (should exist):');
  let newTablesMissing = false;
  for (const table of newTables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`  ❌ ${table} - Missing or error: ${error.message}`);
        newTablesMissing = true;
      } else {
        console.log(`  ✅ ${table} - Exists (${data.length} records)`);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - Missing or error: ${err.message}`);
      newTablesMissing = true;
    }
  }
  
  console.log('\n📊 Summary:');
  if (!oldTablesExist && !newTablesMissing) {
    console.log('🎉 CLEANUP SUCCESSFUL!');
    console.log('✅ Old schema tables removed');
    console.log('✅ New schema tables preserved');
    console.log('✅ Database is clean and optimized');
  } else {
    console.log('⚠️  CLEANUP ISSUES DETECTED:');
    if (oldTablesExist) {
      console.log('❌ Some old tables still exist');
    }
    if (newTablesMissing) {
      console.log('❌ Some new tables are missing');
    }
  }
  
  // Test API endpoints
  console.log('\n🔗 Testing API endpoints:');
  try {
    const response = await fetch('http://localhost:3001/api/classes');
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ /api/classes - Working (${data.count || 0} classes)`);
    } else {
      console.log(`❌ /api/classes - Error: ${response.status}`);
    }
  } catch (err) {
    console.log(`❌ /api/classes - Connection failed: ${err.message}`);
  }
}

verifyCleanup().catch(console.error);
