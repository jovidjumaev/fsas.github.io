const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearOldAttendanceRecords() {
  try {
    console.log('🧹 Clearing Old Attendance Records');
    console.log('='.repeat(60));
    
    const sessionId = '63002aa0-eedf-4666-a9fa-10b7eff45c40';
    
    // Delete old attendance records
    const { error: deleteError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('session_id', sessionId);
    
    if (deleteError) {
      console.error('❌ Error deleting records:', deleteError);
      return;
    }
    
    console.log('✅ Cleared old attendance records for session:', sessionId);
    
    // Reset session to active status
    const { error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'active',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (updateError) {
      console.error('❌ Error updating session:', updateError);
      return;
    }
    
    console.log('✅ Reset session to active status');
    console.log('🎉 Session is now ready for fresh attendance tracking!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearOldAttendanceRecords();

