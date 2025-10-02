// =====================================================
// SIMPLE DATABASE ANALYSIS
// =====================================================
// This script performs a focused analysis of the current database state

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabase() {
  console.log('🔍 DATABASE ANALYSIS REPORT\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Check core tables and data counts
    console.log('\n1️⃣ CORE TABLES & DATA COUNTS');
    console.log('-'.repeat(30));
    
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
    
    // 2. Sample data analysis
    console.log('\n2️⃣ SAMPLE DATA ANALYSIS');
    console.log('-'.repeat(30));
    
    // Users sample
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, created_at')
      .limit(3);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log('👥 Users:');
      users.forEach(user => {
        console.log(`   👤 ${user.first_name} ${user.last_name} (${user.role}) - ${user.email}`);
      });
    }
    
    // Classes sample
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, code, name, room_location, schedule_info, is_active')
      .limit(3);
    
    if (classesError) {
      console.log('❌ Error fetching classes:', classesError.message);
    } else {
      console.log('📚 Classes:');
      classes.forEach(cls => {
        console.log(`   📖 ${cls.code}: ${cls.name} (${cls.room_location || 'No room'})`);
        console.log(`       Schedule: ${cls.schedule_info || 'No schedule'} | Active: ${cls.is_active}`);
      });
    }
    
    // Sessions sample
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, date, start_time, end_time, room_location, notes, is_active')
      .limit(3);
    
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
    
    // 3. Data integrity checks
    console.log('\n3️⃣ DATA INTEGRITY CHECKS');
    console.log('-'.repeat(30));
    
    // Check for users without email
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
    
    // 4. System functionality analysis
    console.log('\n4️⃣ SYSTEM FUNCTIONALITY ANALYSIS');
    console.log('-'.repeat(30));
    
    // Check if we have the minimum required data
    const hasUsers = tableCounts['users'] > 0;
    const hasClasses = tableCounts['classes'] > 0;
    const hasSessions = tableCounts['sessions'] > 0;
    const hasStudents = tableCounts['students'] > 0;
    const hasAttendance = tableCounts['attendance'] > 0;
    
    console.log('🔍 System Readiness:');
    console.log(`   ${hasUsers ? '✅' : '❌'} Users: ${tableCounts['users']} (Need: >0)`);
    console.log(`   ${hasClasses ? '✅' : '❌'} Classes: ${tableCounts['classes']} (Need: >0)`);
    console.log(`   ${hasSessions ? '✅' : '❌'} Sessions: ${tableCounts['sessions']} (Need: >0)`);
    console.log(`   ${hasStudents ? '✅' : '❌'} Students: ${tableCounts['students']} (Need: >0)`);
    console.log(`   ${hasAttendance ? '✅' : '❌'} Attendance: ${tableCounts['attendance']} (Need: >0)`);
    
    // 5. Issues and recommendations
    console.log('\n5️⃣ ISSUES & RECOMMENDATIONS');
    console.log('-'.repeat(30));
    
    const issues = [];
    const recommendations = [];
    
    // Check for critical issues
    if (!hasUsers) {
      issues.push('🚨 No users found - system cannot function');
    }
    
    if (!hasClasses) {
      issues.push('🚨 No classes found - system cannot function');
    }
    
    if (!hasSessions) {
      issues.push('🚨 No sessions found - attendance cannot be tracked');
    }
    
    if (!hasStudents) {
      issues.push('⚠️  No students found - need to add students for testing');
      recommendations.push('Add sample students through Supabase Auth');
    }
    
    if (!hasAttendance) {
      issues.push('⚠️  No attendance records - system not being used');
      recommendations.push('Test attendance recording functionality');
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
    
    // Display issues
    if (issues.length > 0) {
      console.log('🚨 Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ No critical issues found');
    }
    
    // Display recommendations
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    // 6. Summary
    console.log('\n6️⃣ SUMMARY');
    console.log('-'.repeat(30));
    
    const systemReady = hasUsers && hasClasses && hasSessions;
    const fullyFunctional = systemReady && hasStudents && hasAttendance;
    
    console.log(`📊 Database Status: ${systemReady ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`🎯 Functionality: ${fullyFunctional ? '✅ Fully Functional' : '⚠️  Partially Functional'}`);
    console.log(`📈 Total Records: ${totalRecords}`);
    console.log(`📋 Tables with Data: ${Object.values(tableCounts).filter(count => count > 0).length}/${coreTables.length}`);
    
    if (systemReady) {
      console.log('\n🎉 Database is ready for use!');
      console.log('   Next steps: Add students and test attendance recording');
    } else {
      console.log('\n⚠️  Database needs attention before use');
      console.log('   Fix the issues above before proceeding');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
analyzeDatabase();
