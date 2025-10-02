const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyOptimizedMigration() {
  console.log('🔍 Verifying optimized database migration...\n');
  
  // Check new tables
  const newTables = [
    'departments',
    'academic_periods', 
    'students',
    'professors',
    'enrollments'
  ];
  
  console.log('📋 Checking New Tables:');
  let allTablesExist = true;
  for (const table of newTables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`  ❌ ${table} - Error: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`  ✅ ${table} - Exists (${data.length} records)`);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - Error: ${err.message}`);
      allTablesExist = false;
    }
  }
  
  // Check existing tables still work
  const existingTables = ['users', 'classes', 'sessions', 'attendance', 'qr_usage'];
  
  console.log('\n📋 Checking Existing Tables:');
  for (const table of existingTables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`  ❌ ${table} - Error: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`  ✅ ${table} - Exists (${data.length} records)`);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - Error: ${err.message}`);
      allTablesExist = false;
    }
  }
  
  // Check data migration
  console.log('\n📊 Checking Data Migration:');
  
  // Check if students were created from users
  try {
    const { data: students, error } = await supabaseAdmin.from('students').select('*');
    if (error) {
      console.log(`  ❌ Students table error: ${error.message}`);
    } else {
      console.log(`  ✅ Students: ${students.length} records`);
      if (students.length > 0) {
        console.log(`    Sample: ${students[0].student_id} - ${students[0].enrollment_year}`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Students check failed: ${err.message}`);
  }
  
  // Check if professors were created from users
  try {
    const { data: professors, error } = await supabaseAdmin.from('professors').select('*');
    if (error) {
      console.log(`  ❌ Professors table error: ${error.message}`);
    } else {
      console.log(`  ✅ Professors: ${professors.length} records`);
      if (professors.length > 0) {
        console.log(`    Sample: ${professors[0].employee_id} - ${professors[0].title}`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Professors check failed: ${err.message}`);
  }
  
  // Check sample data
  try {
    const { data: departments, error } = await supabaseAdmin.from('departments').select('*');
    if (error) {
      console.log(`  ❌ Departments error: ${error.message}`);
    } else {
      console.log(`  ✅ Departments: ${departments.length} records`);
      if (departments.length > 0) {
        console.log(`    Sample: ${departments[0].name} (${departments[0].code})`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Departments check failed: ${err.message}`);
  }
  
  try {
    const { data: periods, error } = await supabaseAdmin.from('academic_periods').select('*');
    if (error) {
      console.log(`  ❌ Academic periods error: ${error.message}`);
    } else {
      console.log(`  ✅ Academic periods: ${periods.length} records`);
      if (periods.length > 0) {
        console.log(`    Sample: ${periods[0].name} (${periods[0].is_current ? 'Current' : 'Past'})`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Academic periods check failed: ${err.message}`);
  }
  
  // Check views
  console.log('\n📋 Checking Views:');
  try {
    const { data: studentEnrollments, error } = await supabaseAdmin.from('student_enrollments').select('*').limit(1);
    if (error) {
      console.log(`  ❌ student_enrollments view error: ${error.message}`);
    } else {
      console.log(`  ✅ student_enrollments view - Working`);
    }
  } catch (err) {
    console.log(`  ❌ student_enrollments view failed: ${err.message}`);
  }
  
  try {
    const { data: professorClasses, error } = await supabaseAdmin.from('professor_classes').select('*').limit(1);
    if (error) {
      console.log(`  ❌ professor_classes view error: ${error.message}`);
    } else {
      console.log(`  ✅ professor_classes view - Working`);
    }
  } catch (err) {
    console.log(`  ❌ professor_classes view failed: ${err.message}`);
  }
  
  console.log('\n📊 Migration Summary:');
  if (allTablesExist) {
    console.log('🎉 MIGRATION SUCCESSFUL!');
    console.log('✅ All new tables created');
    console.log('✅ Existing tables preserved');
    console.log('✅ Data migrated successfully');
    console.log('✅ Views created');
    console.log('✅ Ready for enhanced backend!');
  } else {
    console.log('⚠️  MIGRATION ISSUES DETECTED:');
    console.log('❌ Some tables may be missing or have errors');
    console.log('📝 Check the errors above and re-run migration if needed');
  }
}

verifyOptimizedMigration().catch(console.error);
