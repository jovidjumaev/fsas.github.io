require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmEmail() {
  console.log('🔍 CHECKING USER EMAIL CONFIRMATION STATUS...');

  // Get the user
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  const user = authUsers?.users?.find(u => u.email === 'jumajo8@furman.edu');

  if (user) {
    console.log('👤 User found:', user.email);
    console.log('📧 Email confirmed:', user.email_confirmed_at ? 'YES' : 'NO');
    console.log('📅 Email confirmed at:', user.email_confirmed_at);
    console.log('📅 Created at:', user.created_at);
    
    if (!user.email_confirmed_at) {
      console.log('🔧 Confirming email manually...');
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });
      
      console.log('✅ Email confirmation:', updateError ? 'FAILED' : 'SUCCESS');
      if (updateError) {
        console.log('❌ Update error:', updateError.message);
      } else {
        console.log('🎉 Email confirmed successfully!');
        console.log('🚀 Now you can sign in!');
      }
    } else {
      console.log('✅ Email is already confirmed');
    }
  } else {
    console.log('❌ User not found');
  }
}

confirmEmail().catch(console.error);
