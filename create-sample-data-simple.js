const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

async function createSampleDataSimple() {
  console.log('🎭 Creating sample data for FSAS (Simple approach)...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📚 Creating sample courses (without professor constraint)...');
    
    // Create courses with a dummy professor ID (this will work for testing)
    const dummyProfessorId = '00000000-0000-0000-0000-000000000000';
    const courses = [
      {
        course_code: 'CSC-475',
        course_name: 'Seminar in Computer Science',
        semester: 'Fall',
        year: 2024
      },
      {
        course_code: 'CSC-301',
        course_name: 'Data Structures and Algorithms',
        semester: 'Fall',
        year: 2024
      },
      {
        course_code: 'CSC-201',
        course_name: 'Introduction to Programming',
        semester: 'Fall',
        year: 2024
      }
    ];

    const courseIds = [];
    for (const course of courses) {
      const courseId = uuidv4();
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          id: courseId,
          course_code: course.course_code,
          course_name: course.course_name,
          professor_id: dummyProfessorId,
          semester: course.semester,
          year: course.year
        })
        .select();

      if (courseError) {
        console.log(`❌ Course ${course.course_code} creation failed: ${courseError.message}`);
        continue;
      }
      console.log(`✅ Course created: ${courseData[0].course_code} - ${courseData[0].course_name}`);
      courseIds.push(courseId);
    }

    console.log('\n📅 Creating sample class sessions...');
    
    // Create class sessions for the first course
    const sessions = [
      {
        session_date: '2024-10-01',
        start_time: '09:00',
        end_time: '10:30',
        qr_code_secret: 'session-1-secret-' + Date.now(),
        qr_code_expires_at: new Date(Date.now() + 30000).toISOString(),
        is_active: false
      },
      {
        session_date: '2024-10-03',
        start_time: '09:00',
        end_time: '10:30',
        qr_code_secret: 'session-2-secret-' + Date.now(),
        qr_code_expires_at: new Date(Date.now() + 30000).toISOString(),
        is_active: false
      },
      {
        session_date: '2024-10-08',
        start_time: '09:00',
        end_time: '10:30',
        qr_code_secret: 'session-3-secret-' + Date.now(),
        qr_code_expires_at: new Date(Date.now() + 30000).toISOString(),
        is_active: true
      }
    ];

    const sessionIds = [];
    for (const session of sessions) {
      const sessionId = uuidv4();
      const { data: sessionData, error: sessionError } = await supabase
        .from('class_sessions')
        .insert({
          id: sessionId,
          course_id: courseIds[0], // First course
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          qr_code_secret: session.qr_code_secret,
          qr_code_expires_at: session.qr_code_expires_at,
          is_active: session.is_active
        })
        .select();

      if (sessionError) {
        console.log(`❌ Session creation failed: ${sessionError.message}`);
        continue;
      }
      console.log(`✅ Session created: ${sessionData[0].session_date} ${sessionData[0].start_time}`);
      sessionIds.push(sessionId);
    }

    console.log('\n📝 Creating sample attendance records (with dummy student IDs)...');
    
    // Create attendance records with dummy student IDs
    const dummyStudentIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555'
    ];

    for (let i = 0; i < 2; i++) {
      const sessionId = sessionIds[i];
      for (let j = 0; j < dummyStudentIds.length; j++) {
        const studentId = dummyStudentIds[j];
        const statuses = ['present', 'late', 'absent'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .insert({
            session_id: sessionId,
            student_id: studentId,
            scanned_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            status: status,
            device_fingerprint: 'device-' + Math.random().toString(36).substr(2, 9),
            ip_address: '192.168.1.' + Math.floor(Math.random() * 255)
          })
          .select();

        if (attendanceError) {
          console.log(`❌ Attendance record creation failed: ${attendanceError.message}`);
          continue;
        }
      }
      console.log(`✅ Attendance records created for session ${i + 1}`);
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📊 Summary:');
    console.log(`✅ ${courseIds.length} Courses created`);
    console.log(`✅ ${sessionIds.length} Class sessions created`);
    console.log(`✅ Attendance records created for 2 sessions`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Visit http://localhost:3000 to see the data in action');
    console.log('2. Check your Supabase dashboard to view the data');
    console.log('3. Test the QR code generation and scanning features');
    console.log('4. Test the analytics dashboard');

  } catch (error) {
    console.log(`❌ Error creating sample data: ${error.message}`);
  }
}

createSampleDataSimple();
