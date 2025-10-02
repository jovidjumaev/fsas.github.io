// =====================================================
// RUN SAMPLE DATA SCRIPT
// =====================================================
// This script executes the sample data SQL

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSampleData() {
  console.log('🚀 Adding Sample Data...\n');
  
  try {
    // 1. Add sample attendance records using the professor's ID
    console.log('1️⃣ Adding sample attendance records...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, date, start_time, class_id')
      .eq('is_active', true)
      .limit(5);
    
    if (sessionsError) {
      console.log('❌ Error fetching sessions:', sessionsError.message);
      return;
    }
    
    console.log(`Found ${sessions.length} active sessions`);
    
    // Add attendance records
    const attendanceRecords = [];
    for (let i = 0; i < Math.min(3, sessions.length); i++) {
      const session = sessions[i];
      attendanceRecords.push({
        student_id: 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', // Professor ID for testing
        session_id: session.id,
        status: i === 1 ? 'late' : 'present',
        device_fingerprint: `device_fingerprint_prof_${i + 1}`,
        scanned_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    const { error: attendanceError } = await supabase
      .from('attendance')
      .insert(attendanceRecords);
    
    if (attendanceError) {
      console.log('❌ Error adding attendance:', attendanceError.message);
    } else {
      console.log(`✅ Added ${attendanceRecords.length} attendance records`);
    }
    
    // 2. Add sample QR usage records
    console.log('\n2️⃣ Adding sample QR usage records...');
    
    const qrUsageRecords = [];
    for (let i = 0; i < Math.min(3, sessions.length); i++) {
      const session = sessions[i];
      qrUsageRecords.push({
        session_id: session.id,
        qr_code_secret: `qr_secret_${session.date}_${session.start_time}`,
        used_by: 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb',
        device_fingerprint: `device_fingerprint_prof_${i + 1}`
      });
    }
    
    const { error: qrError } = await supabase
      .from('qr_usage')
      .insert(qrUsageRecords);
    
    if (qrError) {
      console.log('❌ Error adding QR usage:', qrError.message);
    } else {
      console.log(`✅ Added ${qrUsageRecords.length} QR usage records`);
    }
    
    // 3. Verify the data
    console.log('\n3️⃣ Verifying data...');
    
    const { count: attendanceCount } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true });
    
    const { count: qrUsageCount } = await supabase
      .from('qr_usage')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Final counts:`);
    console.log(`   Attendance records: ${attendanceCount}`);
    console.log(`   QR usage records: ${qrUsageCount}`);
    
    console.log('\n🎉 Sample data added successfully!');
    console.log('✅ System is now ready for testing');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
runSampleData();
