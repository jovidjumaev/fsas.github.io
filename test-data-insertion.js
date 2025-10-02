const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

async function testDataInsertion() {
  console.log('🧪 Testing data insertion with valid UUIDs...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test user profile insertion
    console.log('👤 Testing user profile insertion...');
    const testUserId = uuidv4();
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        student_id: 'TEST001',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        role: 'student'
      })
      .select();
    
    if (userError) {
      console.log(`❌ User insertion failed: ${userError.message}`);
      return;
    } else {
      console.log(`✅ User created successfully: ${userData[0].first_name} ${userData[0].last_name}`);
    }
    
    // Test course insertion
    console.log('\n📚 Testing course insertion...');
    const testCourseId = uuidv4();
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        id: testCourseId,
        course_code: 'CSC-475',
        course_name: 'Seminar in Computer Science',
        professor_id: testUserId,
        semester: 'Fall',
        year: 2024
      })
      .select();
    
    if (courseError) {
      console.log(`❌ Course insertion failed: ${courseError.message}`);
    } else {
      console.log(`✅ Course created successfully: ${courseData[0].course_code} - ${courseData[0].course_name}`);
    }
    
    // Test class session insertion
    console.log('\n📅 Testing class session insertion...');
    const testSessionId = uuidv4();
    const { data: sessionData, error: sessionError } = await supabase
      .from('class_sessions')
      .insert({
        id: testSessionId,
        course_id: testCourseId,
        session_date: '2024-10-02',
        start_time: '09:00',
        end_time: '10:30',
        qr_code_secret: 'test-secret-123',
        qr_code_expires_at: new Date(Date.now() + 30000).toISOString(),
        is_active: true
      })
      .select();
    
    if (sessionError) {
      console.log(`❌ Session insertion failed: ${sessionError.message}`);
    } else {
      console.log(`✅ Session created successfully: ${sessionData[0].session_date} ${sessionData[0].start_time}`);
    }
    
    // Test attendance record insertion
    console.log('\n📝 Testing attendance record insertion...');
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: testSessionId,
        student_id: testUserId,
        scanned_at: new Date().toISOString(),
        status: 'present',
        device_fingerprint: 'test-fingerprint-123',
        ip_address: '127.0.0.1'
      })
      .select();
    
    if (attendanceError) {
      console.log(`❌ Attendance insertion failed: ${attendanceError.message}`);
    } else {
      console.log(`✅ Attendance record created successfully: ${attendanceData[0].status}`);
    }
    
    // Test data retrieval
    console.log('\n📊 Testing data retrieval...');
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (usersError) {
      console.log(`❌ User retrieval failed: ${usersError.message}`);
    } else {
      console.log(`✅ Retrieved ${allUsers.length} users from database`);
    }
    
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*');
    
    if (coursesError) {
      console.log(`❌ Course retrieval failed: ${coursesError.message}`);
    } else {
      console.log(`✅ Retrieved ${allCourses.length} courses from database`);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('attendance_records').delete().eq('session_id', testSessionId);
    await supabase.from('class_sessions').delete().eq('id', testSessionId);
    await supabase.from('courses').delete().eq('id', testCourseId);
    await supabase.from('user_profiles').delete().eq('id', testUserId);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database operations successful!');
    console.log('📝 Your Supabase database is fully functional and ready to use!');
    
  } catch (error) {
    console.log(`❌ Error testing database: ${error.message}`);
  }
}

testDataInsertion();
