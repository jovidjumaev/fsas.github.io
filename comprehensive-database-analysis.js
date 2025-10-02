// =====================================================
// COMPREHENSIVE DATABASE ANALYSIS
// =====================================================
// This script performs a complete analysis of the current database state

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabase() {
  console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check all tables and their structure
    console.log('\n1️⃣ TABLE STRUCTURE ANALYSIS');
    console.log('-'.repeat(40));
    
    // Define known tables from our schema
    const knownTables = [
      'users', 'students', 'professors', 'departments', 'academic_periods',
      'classes', 'sessions', 'attendance', 'qr_usage', 'enrollments',
      'notifications', 'attendance_analytics'
    ];
    
    console.log('📊 Checking Known Tables:');
    const existingTables = [];
    
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: Not found or error - ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: Exists`);
          existingTables.push(tableName);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: Error - ${err.message}`);
      }
    }
    
    // 2. Check data counts for each table
    console.log('\n2️⃣ DATA COUNT ANALYSIS');
    console.log('-'.repeat(40));
    
    const tableCounts = {};
    for (const tableName of existingTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${tableName}: Error - ${error.message}`);
          tableCounts[tableName] = 'ERROR';
        } else {
          console.log(`   📊 ${tableName}: ${count} records`);
          tableCounts[tableName] = count;
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: Error - ${err.message}`);
        tableCounts[tableName] = 'ERROR';
      }
    }
    
    // 3. Check foreign key relationships
    console.log('\n3️⃣ FOREIGN KEY RELATIONSHIP ANALYSIS');
    console.log('-'.repeat(40));
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        table_name,
        constraint_type
      `)
      .eq('constraint_type', 'FOREIGN KEY')
      .eq('table_schema', 'public');
    
    if (constraintsError) {
      console.log('❌ Error fetching constraints:', constraintsError.message);
    } else {
      console.log('🔗 Foreign Key Constraints:');
      constraints.forEach(constraint => {
        console.log(`   🔗 ${constraint.table_name}.${constraint.constraint_name}`);
      });
    }
    
    // 4. Check indexes
    console.log('\n4️⃣ INDEX ANALYSIS');
    console.log('-'.repeat(40));
    
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .eq('schemaname', 'public')
      .order('tablename');
    
    if (indexesError) {
      console.log('❌ Error fetching indexes:', indexesError.message);
    } else {
      console.log('📇 Database Indexes:');
      indexes.forEach(index => {
        console.log(`   📇 ${index.tablename}.${index.indexname}`);
      });
    }
    
    // 5. Check RLS policies
    console.log('\n5️⃣ ROW LEVEL SECURITY ANALYSIS');
    console.log('-'.repeat(40));
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .eq('schemaname', 'public');
    
    if (policiesError) {
      console.log('❌ Error fetching RLS policies:', policiesError.message);
    } else {
      console.log('🔒 RLS Policies:');
      if (policies.length === 0) {
        console.log('   ⚠️  No RLS policies found - tables may be unprotected');
      } else {
        policies.forEach(policy => {
          console.log(`   🔒 ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
        });
      }
    }
    
    // 6. Sample data analysis
    console.log('\n6️⃣ SAMPLE DATA ANALYSIS');
    console.log('-'.repeat(40));
    
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log('👥 Users Sample:');
      users.forEach(user => {
        console.log(`   👤 ${user.first_name} ${user.last_name} (${user.role})`);
      });
    }
    
    // Check classes table
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .limit(3);
    
    if (classesError) {
      console.log('❌ Error fetching classes:', classesError.message);
    } else {
      console.log('📚 Classes Sample:');
      classes.forEach(cls => {
        console.log(`   📖 ${cls.code}: ${cls.name}`);
      });
    }
    
    // Check sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(3);
    
    if (sessionsError) {
      console.log('❌ Error fetching sessions:', sessionsError.message);
    } else {
      console.log('📅 Sessions Sample:');
      sessions.forEach(session => {
        console.log(`   📅 ${session.date} ${session.start_time}-${session.end_time}`);
      });
    }
    
    // 7. Data integrity checks
    console.log('\n7️⃣ DATA INTEGRITY CHECKS');
    console.log('-'.repeat(40));
    
    // Check for orphaned records
    const { data: orphanedSessions, error: orphanedSessionsError } = await supabase
      .from('sessions')
      .select('id, class_id')
      .not('class_id', 'in', `(SELECT id FROM classes)`);
    
    if (orphanedSessionsError) {
      console.log('❌ Error checking orphaned sessions:', orphanedSessionsError.message);
    } else if (orphanedSessions.length > 0) {
      console.log(`⚠️  Found ${orphanedSessions.length} orphaned sessions`);
    } else {
      console.log('✅ No orphaned sessions found');
    }
    
    // Check for missing required fields
    const { data: nullEmails, error: nullEmailsError } = await supabase
      .from('users')
      .select('id, email')
      .is('email', null);
    
    if (nullEmailsError) {
      console.log('❌ Error checking null emails:', nullEmailsError.message);
    } else if (nullEmails.length > 0) {
      console.log(`⚠️  Found ${nullEmails.length} users with null emails`);
    } else {
      console.log('✅ All users have email addresses');
    }
    
    // 8. Performance analysis
    console.log('\n8️⃣ PERFORMANCE ANALYSIS');
    console.log('-'.repeat(40));
    
    // Check table sizes
    const { data: tableSizes, error: tableSizesError } = await supabase
      .from('pg_stat_user_tables')
      .select('relname, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup')
      .eq('schemaname', 'public');
    
    if (tableSizesError) {
      console.log('❌ Error fetching table sizes:', tableSizesError.message);
    } else {
      console.log('📊 Table Statistics:');
      tableSizes.forEach(table => {
        console.log(`   📊 ${table.relname}: ${table.n_live_tup} live, ${table.n_dead_tup} dead tuples`);
      });
    }
    
    // 9. Summary and recommendations
    console.log('\n9️⃣ ANALYSIS SUMMARY & RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    const totalTables = tables.filter(t => t.table_type === 'BASE TABLE').length;
    const totalRecords = Object.values(tableCounts).reduce((sum, count) => {
      return sum + (typeof count === 'number' ? count : 0);
    }, 0);
    
    console.log(`📊 Database Overview:`);
    console.log(`   📋 Total Tables: ${totalTables}`);
    console.log(`   📊 Total Records: ${totalRecords}`);
    console.log(`   🔗 Foreign Keys: ${constraints ? constraints.length : 0}`);
    console.log(`   📇 Indexes: ${indexes ? indexes.length : 0}`);
    console.log(`   🔒 RLS Policies: ${policies ? policies.length : 0}`);
    
    // Identify issues
    const issues = [];
    
    if (tableCounts['attendance'] === 0) {
      issues.push('⚠️  No attendance records - system not being used');
    }
    
    if (tableCounts['qr_usage'] === 0) {
      issues.push('⚠️  No QR usage records - QR system not being used');
    }
    
    if (tableCounts['students'] === 0) {
      issues.push('⚠️  No students enrolled - need to add students');
    }
    
    if (policies && policies.length === 0) {
      issues.push('🔒 No RLS policies - database may be unprotected');
    }
    
    if (issues.length > 0) {
      console.log('\n🚨 Issues Identified:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n✅ No major issues identified');
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('   1. Add RLS policies for security');
    console.log('   2. Add more sample data for testing');
    console.log('   3. Test attendance recording functionality');
    console.log('   4. Add database constraints validation');
    console.log('   5. Consider adding database triggers for automation');
    
    console.log('\n🎉 Database Analysis Complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
analyzeDatabase();
