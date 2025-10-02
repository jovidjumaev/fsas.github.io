// =====================================================
// COMPREHENSIVE DATABASE ANALYSIS - FINAL
// =====================================================
// This script performs a complete analysis of the current database state after improvements

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabaseFinal() {
  console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS - FINAL REPORT\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check all tables and their data counts
    console.log('\n1️⃣ DATABASE OVERVIEW');
    console.log('-'.repeat(40));
    
    const coreTables = [
      'users', 'students', 'professors', 'departments', 'academic_periods',
      'classes', 'sessions', 'attendance', 'qr_usage', 'enrollments'
    ];
    
    const tableCounts = {};
    let totalRecords = 0;
    
    for (const tableName of coreTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${tableName}: Error - ${error.message}`);
          tableCounts[tableName] = 0;
        } else {
          console.log(`   📊 ${tableName}: ${count} records`);
          tableCounts[tableName] = count;
          totalRecords += count;
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: Error - ${err.message}`);
        tableCounts[tableName] = 0;
      }
    }
    
    // 2. Check RLS policies
    console.log('\n2️⃣ ROW LEVEL SECURITY STATUS');
    console.log('-'.repeat(40));
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('rowsecurity', true);
    
    if (rlsError) {
      console.log('❌ Error checking RLS status:', rlsError.message);
    } else {
      console.log(`✅ RLS enabled on ${rlsStatus.length} tables:`);
      rlsStatus.forEach(table => {
        console.log(`   🔒 ${table.tablename}`);
      });
    }
    
    // 3. Check indexes
    console.log('\n3️⃣ PERFORMANCE INDEXES STATUS');
    console.log('-'.repeat(40));
    
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%')
      .order('tablename');
    
    if (indexesError) {
      console.log('❌ Error checking indexes:', indexesError.message);
    } else {
      console.log(`✅ Found ${indexes.length} performance indexes:`);
      const indexGroups = {};
      indexes.forEach(index => {
        if (!indexGroups[index.tablename]) {
          indexGroups[index.tablename] = [];
        }
        indexGroups[index.tablename].push(index.indexname);
      });
      
      Object.keys(indexGroups).forEach(table => {
        console.log(`   📇 ${table}: ${indexGroups[table].length} indexes`);
        indexGroups[table].forEach(idx => {
          console.log(`      - ${idx}`);
        });
      });
    }
    
    // 4. Check constraints
    console.log('\n4️⃣ DATA VALIDATION CONSTRAINTS STATUS');
    console.log('-'.repeat(40));
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('pg_constraint')
      .select('conname, contype')
      .like('conname', 'check_%')
      .order('conname');
    
    if (constraintsError) {
      console.log('❌ Error checking constraints:', constraintsError.message);
    } else {
      console.log(`✅ Found ${constraints.length} validation constraints:`);
      constraints.forEach(constraint => {
        const type = constraint.contype === 'c' ? 'CHECK' : constraint.contype;
        console.log(`   ✅ ${constraint.conname} (${type})`);
      });
    }
    
    // 5. Sample data analysis
    console.log('\n5️⃣ SAMPLE DATA ANALYSIS');
    console.log('-'.repeat(40));
    
    // Users analysis
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, created_at')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log('👥 Users:');
      users.forEach(user => {
        console.log(`   👤 ${user.first_name} ${user.last_name} (${user.role}) - ${user.email}`);
        console.log(`       Created: ${new Date(user.created_at).toLocaleDateString()}`);
      });
    }
    
    // Classes analysis
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, code, name, room_location, schedule_info, is_active, max_students, credits')
      .limit(5);
    
    if (classesError) {
      console.log('❌ Error fetching classes:', classesError.message);
    } else {
      console.log('📚 Classes:');
      classes.forEach(cls => {
        console.log(`   📖 ${cls.code}: ${cls.name}`);
        console.log(`       Room: ${cls.room_location || 'No room'} | Schedule: ${cls.schedule_info || 'No schedule'}`);
        console.log(`       Max Students: ${cls.max_students} | Credits: ${cls.credits} | Active: ${cls.is_active}`);
      });
    }
    
    // Sessions analysis
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, date, start_time, end_time, room_location, notes, is_active')
      .limit(5);
    
    if (sessionsError) {
      console.log('❌ Error fetching sessions:', sessionsError.message);
    } else {
      console.log('📅 Sessions:');
      sessions.forEach(session => {
        console.log(`   📅 ${session.date} ${session.start_time}-${session.end_time}`);
        console.log(`       Room: ${session.room_location || 'No room'} | Notes: ${session.notes || 'None'}`);
        console.log(`       Active: ${session.is_active}`);
      });
    }
    
    // 6. Data integrity checks
    console.log('\n6️⃣ DATA INTEGRITY ANALYSIS');
    console.log('-'.repeat(40));
    
    // Check for data quality issues
    const { data: usersWithoutEmail, error: emailError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .is('email', null);
    
    if (emailError) {
      console.log('❌ Error checking email integrity:', emailError.message);
    } else if (usersWithoutEmail.length > 0) {
      console.log(`⚠️  Found ${usersWithoutEmail.length} users without email addresses`);
    } else {
      console.log('✅ All users have email addresses');
    }
    
    // Check for classes without professor
    const { data: classesWithoutProf, error: profError } = await supabase
      .from('classes')
      .select('id, code, name')
      .is('professor_id', null);
    
    if (profError) {
      console.log('❌ Error checking professor integrity:', profError.message);
    } else if (classesWithoutProf.length > 0) {
      console.log(`⚠️  Found ${classesWithoutProf.length} classes without professor assignments`);
    } else {
      console.log('✅ All classes have professor assignments');
    }
    
    // Check for sessions without class
    const { data: sessionsWithoutClass, error: classError } = await supabase
      .from('sessions')
      .select('id, date, start_time')
      .is('class_id', null);
    
    if (classError) {
      console.log('❌ Error checking class integrity:', classError.message);
    } else if (sessionsWithoutClass.length > 0) {
      console.log(`⚠️  Found ${sessionsWithoutClass.length} sessions without class assignments`);
    } else {
      console.log('✅ All sessions have class assignments');
    }
    
    // 7. System functionality analysis
    console.log('\n7️⃣ SYSTEM FUNCTIONALITY ANALYSIS');
    console.log('-'.repeat(40));
    
    const hasUsers = tableCounts['users'] > 0;
    const hasClasses = tableCounts['classes'] > 0;
    const hasSessions = tableCounts['sessions'] > 0;
    const hasStudents = tableCounts['students'] > 0;
    const hasAttendance = tableCounts['attendance'] > 0;
    const hasEnrollments = tableCounts['enrollments'] > 0;
    
    console.log('🔍 System Readiness:');
    console.log(`   ${hasUsers ? '✅' : '❌'} Users: ${tableCounts['users']} (Need: >0)`);
    console.log(`   ${hasClasses ? '✅' : '❌'} Classes: ${tableCounts['classes']} (Need: >0)`);
    console.log(`   ${hasSessions ? '✅' : '❌'} Sessions: ${tableCounts['sessions']} (Need: >0)`);
    console.log(`   ${hasStudents ? '✅' : '❌'} Students: ${tableCounts['students']} (Need: >0)`);
    console.log(`   ${hasAttendance ? '✅' : '❌'} Attendance: ${tableCounts['attendance']} (Need: >0)`);
    console.log(`   ${hasEnrollments ? '✅' : '❌'} Enrollments: ${tableCounts['enrollments']} (Need: >0)`);
    
    // 8. Performance analysis
    console.log('\n8️⃣ PERFORMANCE ANALYSIS');
    console.log('-'.repeat(40));
    
    // Test query performance
    const performanceStart = Date.now();
    
    const queries = [
      supabase.from('users').select('*').limit(10),
      supabase.from('classes').select('*').limit(10),
      supabase.from('sessions').select('*').limit(10),
      supabase.from('departments').select('*').limit(10),
      supabase.from('academic_periods').select('*').limit(10)
    ];
    
    const results = await Promise.all(queries);
    const performanceTime = Date.now() - performanceStart;
    
    const successCount = results.filter(r => !r.error).length;
    console.log(`✅ Executed ${queries.length} queries in ${performanceTime}ms`);
    console.log(`   ${successCount}/${queries.length} queries successful`);
    console.log(`   Average query time: ${Math.round(performanceTime / queries.length)}ms`);
    
    // 9. Issues and recommendations
    console.log('\n9️⃣ ISSUES & RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    const issues = [];
    const recommendations = [];
    const criticalIssues = [];
    
    // Check for critical issues
    if (!hasUsers) {
      criticalIssues.push('🚨 No users found - system cannot function');
    }
    
    if (!hasClasses) {
      criticalIssues.push('🚨 No classes found - system cannot function');
    }
    
    if (!hasSessions) {
      criticalIssues.push('🚨 No sessions found - attendance cannot be tracked');
    }
    
    if (!hasStudents) {
      issues.push('⚠️  No students found - need to add students for testing');
      recommendations.push('Add sample students through Supabase Auth');
    }
    
    if (!hasAttendance) {
      issues.push('⚠️  No attendance records - system not being used');
      recommendations.push('Test attendance recording functionality');
    }
    
    if (!hasEnrollments) {
      issues.push('⚠️  No enrollments found - students not enrolled in classes');
      recommendations.push('Add student enrollments to classes');
    }
    
    // Check for data quality issues
    if (tableCounts['sessions'] > 0 && tableCounts['attendance'] === 0) {
      issues.push('⚠️  Sessions exist but no attendance recorded');
      recommendations.push('Test QR code scanning and attendance recording');
    }
    
    if (tableCounts['classes'] > 0 && tableCounts['enrollments'] === 0) {
      issues.push('⚠️  Classes exist but no enrollments');
      recommendations.push('Add student enrollments to classes');
    }
    
    // Check for missing department assignments
    const { data: professorsWithoutDept, error: deptError } = await supabase
      .from('professors')
      .select('user_id, employee_id')
      .is('department_id', null);
    
    if (deptError) {
      console.log('❌ Error checking professor departments:', deptError.message);
    } else if (professorsWithoutDept.length > 0) {
      issues.push('⚠️  Found professors without department assignments');
      recommendations.push('Assign professors to departments');
    } else {
      console.log('✅ All professors have department assignments');
    }
    
    // Display issues
    if (criticalIssues.length > 0) {
      console.log('🚨 Critical Issues:');
      criticalIssues.forEach(issue => console.log(`   ${issue}`));
    }
    
    if (issues.length > 0) {
      console.log('⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ No issues found');
    }
    
    // Display recommendations
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    // 10. Summary and next steps
    console.log('\n🔟 SUMMARY & NEXT STEPS');
    console.log('-'.repeat(40));
    
    const systemReady = hasUsers && hasClasses && hasSessions;
    const fullyFunctional = systemReady && hasStudents && hasAttendance && hasEnrollments;
    
    console.log(`📊 Database Status: ${systemReady ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`🎯 Functionality: ${fullyFunctional ? '✅ Fully Functional' : '⚠️  Partially Functional'}`);
    console.log(`📈 Total Records: ${totalRecords}`);
    console.log(`📋 Tables with Data: ${Object.values(tableCounts).filter(count => count > 0).length}/${coreTables.length}`);
    console.log(`🔒 RLS Enabled: ${rlsStatus ? rlsStatus.length : 0} tables`);
    console.log(`📇 Indexes Created: ${indexes ? indexes.length : 0}`);
    console.log(`✅ Constraints Added: ${constraints ? constraints.length : 0}`);
    
    if (systemReady) {
      console.log('\n🎉 Database is ready for use!');
      if (fullyFunctional) {
        console.log('   System is fully functional and ready for production!');
      } else {
        console.log('   Next steps: Add students and test attendance recording');
      }
    } else {
      console.log('\n⚠️  Database needs attention before use');
      console.log('   Fix the critical issues above before proceeding');
    }
    
    // Priority recommendations
    console.log('\n🎯 Priority Actions:');
    if (criticalIssues.length > 0) {
      console.log('   1. Fix critical issues first');
    }
    if (!hasStudents) {
      console.log('   2. Add sample students for testing');
    }
    if (!hasEnrollments) {
      console.log('   3. Create student enrollments');
    }
    if (!hasAttendance) {
      console.log('   4. Test attendance recording workflow');
    }
    if (professorsWithoutDept && professorsWithoutDept.length > 0) {
      console.log('   5. Assign professors to departments');
    }
    
    console.log('\n🎉 Database Analysis Complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
analyzeDatabaseFinal();
