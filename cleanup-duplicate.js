require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicate() {
  console.log('🧹 CLEANING UP DUPLICATE STUDENT ID...');

  // Find and delete the existing student with ID 5002378
  const { data: existingStudent, error: studentError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('student_id', '5002378');

  console.log('🔍 Found existing student:', existingStudent?.length || 0);

  if (existingStudent && existingStudent.length > 0) {
    console.log('🗑️ Deleting existing student with ID 5002378...');
    
    // Delete the student record
    const { error: deleteError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('student_id', '5002378');
    
    console.log('🎓 Student deletion:', deleteError ? 'FAILED' : 'SUCCESS');
    if (deleteError) {
      console.log('❌ Delete error:', deleteError.message);
    }
  }

  // Also clean up any users with the test email
  const { data: existingUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', 'jovid.jumaev01@gmail.com');

  if (existingUser && existingUser.length > 0) {
    console.log('🗑️ Deleting existing user with email jovid.jumaev01@gmail.com...');
    
    // Delete from students first
    await supabaseAdmin
      .from('students')
      .delete()
      .eq('user_id', existingUser[0].id);
    
    // Delete from users
    const { error: userDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', existingUser[0].id);
    
    console.log('👤 User deletion:', userDeleteError ? 'FAILED' : 'SUCCESS');
  }

  console.log('✅ Cleanup complete!');
  console.log('🎯 Now try registration again with student ID 5002378');
}

cleanupDuplicate().catch(console.error);
