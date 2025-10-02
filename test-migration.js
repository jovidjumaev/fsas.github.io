const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testMigration() {
  console.log('🔄 Testing Database Migration Status\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test old tables
    console.log('📊 Testing OLD Tables (original schema):');
    
    const oldTables = ['user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage'];
    for (const table of oldTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: ${data.length} records`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: Table not found`);
      }
    }

    console.log('\n📊 Testing NEW Tables (simplified schema):');
    
    const newTables = ['users', 'classes', 'sessions', 'attendance', 'qr_usage'];
    for (const table of newTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: ${data.length} records`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: Table not found`);
      }
    }

    console.log('\n🔍 Detailed Data Check:');
    
    // Check if we have data in new tables
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (!usersError && users) {
      console.log(`\n👥 Users (${users.length}):`);
      users.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.role})`);
      });
    }

    const { data: classes, error: classesError } = await supabase.from('classes').select('*');
    if (!classesError && classes) {
      console.log(`\n📚 Classes (${classes.length}):`);
      classes.forEach(cls => {
        console.log(`  - ${cls.code}: ${cls.name}`);
      });
    }

    const { data: sessions, error: sessionsError } = await supabase.from('sessions').select('*');
    if (!sessionsError && sessions) {
      console.log(`\n📅 Sessions (${sessions.length}):`);
      sessions.forEach(session => {
        console.log(`  - ${session.date} ${session.start_time}-${session.end_time}`);
      });
    }

    console.log('\n🎯 Migration Status:');
    if (users && users.length > 0) {
      console.log('✅ Migration appears to be successful!');
      console.log('✅ New simplified tables have data');
      console.log('✅ You can now use the simplified schema');
    } else {
      console.log('⚠️  Migration may not be complete');
      console.log('⚠️  Run the migration script in Supabase SQL Editor');
    }

  } catch (error) {
    console.log('❌ Connection Error:', error.message);
  }
}

testMigration();
