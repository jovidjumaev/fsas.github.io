// =====================================================
// TEST SAMPLE DATA
// =====================================================
// This script tests the sample students and enrollments

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSampleData() {
  console.log('🧪 Testing Sample Data\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Test students
    console.log('\n1️⃣ TESTING STUDENTS');
    console.log('-'.repeat(30));
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        student_id,
        enrollment_year,
        major,
        gpa,
        users!inner(first_name, last_name, email, role)
      `)
      .order('student_id');
    
    if (studentsError) {
      console.log('❌ Error fetching students:', studentsError.message);
    } else {
      console.log(`✅ Found ${students.length} students:`);
      students.forEach(student => {
        console.log(`   👤 ${student.student_id}: ${student.users.first_name} ${student.users.last_name}`);
        console.log(`       Email: ${student.users.email} | Major: ${student.major} | Year: ${student.enrollment_year} | GPA: ${student.gpa}`);
      });
    }
    
    // 2. Test enrollments
    console.log('\n2️⃣ TESTING ENROLLMENTS');
    console.log('-'.repeat(30));
    
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        enrollment_date,
        users!inner(first_name, last_name),
        classes!inner(code, name),
        academic_periods!inner(name)
      `)
      .order('enrollment_date');
    
    if (enrollmentsError) {
      console.log('❌ Error fetching enrollments:', enrollmentsError.message);
    } else {
      console.log(`✅ Found ${enrollments.length} enrollments:`);
      enrollments.forEach(enrollment => {
        console.log(`   🎓 ${enrollment.users.first_name} ${enrollment.users.last_name} → ${enrollment.classes.code}: ${enrollment.classes.name}`);
        console.log(`       Status: ${enrollment.status} | Period: ${enrollment.academic_periods.name} | Date: ${enrollment.enrollment_date}`);
      });
    }
    
    // 3. Test attendance
    console.log('\n3️⃣ TESTING ATTENDANCE');
    console.log('-'.repeat(30));
    
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        scanned_at,
        users!inner(first_name, last_name),
        sessions!inner(date, start_time, classes!inner(code, name))
      `)
      .order('scanned_at');
    
    if (attendanceError) {
      console.log('❌ Error fetching attendance:', attendanceError.message);
    } else {
      console.log(`✅ Found ${attendance.length} attendance records:`);
      attendance.forEach(record => {
        console.log(`   📅 ${record.users.first_name} ${record.users.last_name} → ${record.sessions.classes.code} (${record.sessions.date} ${record.sessions.start_time})`);
        console.log(`       Status: ${record.status} | Scanned: ${new Date(record.scanned_at).toLocaleString()}`);
      });
    }
    
    // 4. Test QR usage
    console.log('\n4️⃣ TESTING QR USAGE');
    console.log('-'.repeat(30));
    
    const { data: qrUsage, error: qrUsageError } = await supabase
      .from('qr_usage')
      .select(`
        id,
        used_at,
        device_fingerprint,
        users!inner(first_name, last_name),
        sessions!inner(date, start_time, classes!inner(code, name))
      `)
      .order('used_at');
    
    if (qrUsageError) {
      console.log('❌ Error fetching QR usage:', qrUsageError.message);
    } else {
      console.log(`✅ Found ${qrUsage.length} QR usage records:`);
      qrUsage.forEach(usage => {
        console.log(`   📱 ${usage.users.first_name} ${usage.users.last_name} → ${usage.sessions.classes.code} (${usage.sessions.date} ${usage.sessions.start_time})`);
        console.log(`       Used: ${new Date(usage.used_at).toLocaleString()} | Device: ${usage.device_fingerprint.substring(0, 16)}...`);
      });
    }
    
    // 5. Test API endpoints
    console.log('\n5️⃣ TESTING API ENDPOINTS');
    console.log('-'.repeat(30));
    
    // Test API endpoints using curl
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Test students endpoint
      const { stdout: studentsResponse } = await execAsync('curl -s http://localhost:3001/api/students');
      const studentsData = JSON.parse(studentsResponse);
      console.log(`✅ Students API: ${studentsData.count} students`);
      
      // Test enrollments endpoint
      const { stdout: enrollmentsResponse } = await execAsync('curl -s http://localhost:3001/api/enrollments');
      const enrollmentsData = JSON.parse(enrollmentsResponse);
      console.log(`✅ Enrollments API: ${enrollmentsData.count} enrollments`);
      
      // Test attendance endpoint
      const { stdout: attendanceResponse } = await execAsync('curl -s http://localhost:3001/api/attendance');
      const attendanceData = JSON.parse(attendanceResponse);
      console.log(`✅ Attendance API: ${attendanceData.count} attendance records`);
      
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
    }
    
    // 6. Test class enrollment counts
    console.log('\n6️⃣ TESTING CLASS ENROLLMENT COUNTS');
    console.log('-'.repeat(30));
    
    const { data: classEnrollments, error: classEnrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        classes!inner(code, name, max_students)
      `)
      .eq('status', 'active');
    
    if (classEnrollmentsError) {
      console.log('❌ Error fetching class enrollments:', classEnrollmentsError.message);
    } else {
      const enrollmentCounts = {};
      classEnrollments.forEach(enrollment => {
        const classCode = enrollment.classes.code;
        if (!enrollmentCounts[classCode]) {
          enrollmentCounts[classCode] = {
            name: enrollment.classes.name,
            maxStudents: enrollment.classes.max_students,
            count: 0
          };
        }
        enrollmentCounts[classCode].count++;
      });
      
      console.log('📊 Class enrollment counts:');
      Object.keys(enrollmentCounts).forEach(classCode => {
        const data = enrollmentCounts[classCode];
        console.log(`   📚 ${classCode}: ${data.name}`);
        console.log(`       Enrolled: ${data.count}/${data.maxStudents} students`);
      });
    }
    
    // 7. Summary
    console.log('\n7️⃣ SUMMARY');
    console.log('-'.repeat(30));
    
    const totalStudents = students ? students.length : 0;
    const totalEnrollments = enrollments ? enrollments.length : 0;
    const totalAttendance = attendance ? attendance.length : 0;
    const totalQRUsage = qrUsage ? qrUsage.length : 0;
    
    console.log('🎯 Sample Data Status:');
    console.log(`   👥 Students: ${totalStudents} (Need: >0)`);
    console.log(`   🎓 Enrollments: ${totalEnrollments} (Need: >0)`);
    console.log(`   📅 Attendance: ${totalAttendance} (Need: >0)`);
    console.log(`   📱 QR Usage: ${totalQRUsage} (Need: >0)`);
    
    if (totalStudents > 0 && totalEnrollments > 0 && totalAttendance > 0) {
      console.log('\n🎉 Sample data successfully added!');
      console.log('✅ System is now fully functional for testing');
      console.log('\n📋 Next Steps:');
      console.log('   1. Test QR code generation for sessions');
      console.log('   2. Test attendance recording workflow');
      console.log('   3. Test real-time updates');
      console.log('   4. Test different user roles and permissions');
    } else {
      console.log('\n⚠️  Sample data incomplete');
      console.log('   Some data may not have been added successfully');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSampleData();
