require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixEmailConfirmation() {
  console.log('🔧 FIXING EMAIL CONFIRMATION ISSUE...');

  // Get all users
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authUsers?.users) {
    console.log(`\n👥 Found ${authUsers.users.length} users`);
    
    for (const user of authUsers.users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      console.log('📧 Email confirmed:', user.email_confirmed_at ? 'YES' : 'NO');
      
      if (!user.email_confirmed_at) {
        console.log('🔧 Confirming email for user...');
        
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });
        
        if (updateError) {
          console.log('❌ Error confirming email:', updateError.message);
        } else {
          console.log('✅ Email confirmed successfully!');
        }
      } else {
        console.log('✅ Email already confirmed');
      }
    }
  }

  // Test sign-in after confirmation
  console.log('\n🧪 Testing sign-in after email confirmation...');
  
  const { createClient: createSupabase } = require('@supabase/supabase-js');
  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Test with jumajo8@furman.edu
  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email: 'jumajo8@furman.edu',
    password: 'password123'
  });

  console.log('Sign-in test result:', signinData?.user ? 'SUCCESS' : 'FAILED');
  if (signinError) {
    console.log('Sign-in error:', signinError.message);
  } else {
    console.log('✅ Sign-in is now working!');
  }
}

fixEmailConfirmation().catch(console.error);
