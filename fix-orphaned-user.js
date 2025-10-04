const { createClient } = require('@supabase/supabase-js');

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zdtxqzpgggolbebrsymp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdHhxenBnZ2dvbGJlYnJzeW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODUwNDI5MSwiZXhwIjoyMDc0MDgwMjkxfQ.CURDVpLekSL0iOnSEurdVwzWKCi5ldQQcgEkR1g3hqU';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function fixOrphanedUser() {
  const testEmail = 'crazy@furman.edu';
  
  console.log('🔧 Fixing orphaned user:', testEmail);
  
  try {
    // Get the orphaned auth user
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const orphanedUser = authUsers?.users?.find(u => u.email?.toLowerCase() === testEmail.toLowerCase());
    
    if (!orphanedUser) {
      console.log('✅ No orphaned user found - email is available for registration');
      return;
    }
    
    console.log('🎯 Found orphaned user:', {
      id: orphanedUser.id,
      email: orphanedUser.email,
      created_at: orphanedUser.created_at
    });
    
    // Option 1: Delete the orphaned auth user (recommended)
    console.log('\n🗑️  Deleting orphaned auth user...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphanedUser.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete auth user:', deleteError);
      
      // Option 2: Create the missing user record as fallback
      console.log('\n🔄 Fallback: Creating missing user record...');
      const { error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: orphanedUser.id,
          email: orphanedUser.email,
          first_name: 'Crazy',
          last_name: 'Smith',
          role: 'student'
        });
      
      if (createError) {
        console.error('❌ Failed to create user record:', createError);
      } else {
        console.log('✅ Created user record as fallback');
        
        // Also create student record
        const { error: studentError } = await supabaseAdmin
          .from('students')
          .insert({
            user_id: orphanedUser.id,
            student_id: '5002379',
            enrollment_year: new Date().getFullYear(),
            major: 'Computer Science'
          });
        
        if (studentError) {
          console.error('❌ Failed to create student record:', studentError);
        } else {
          console.log('✅ Created student record as fallback');
        }
      }
    } else {
      console.log('✅ Successfully deleted orphaned auth user');
      console.log('🎉 Email is now available for registration!');
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
}

fixOrphanedUser();
