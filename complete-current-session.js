const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function completeCurrentSession() {
  try {
    console.log('🔄 Completing Current Session');
    console.log('='.repeat(60));
    
    const sessionId = '63002aa0-eedf-4666-a9fa-10b7eff45c40';
    
    // Complete the current session
    const { error: completeError } = await supabase
      .from('class_sessions')
      .update({
        status: 'completed',
        is_active: false,
        qr_secret: null,
        qr_expires_at: null
      })
      .eq('id', sessionId);
    
    if (completeError) {
      console.error('❌ Error completing session:', completeError);
      return;
    }
    
    console.log('✅ Session completed successfully');
    
    // Reset to scheduled status for a fresh start
    const { error: resetError } = await supabase
      .from('class_sessions')
      .update({
        status: 'scheduled',
        is_active: false,
        qr_secret: null,
        qr_expires_at: null,
        notes: null
      })
      .eq('id', sessionId);
    
    if (resetError) {
      console.error('❌ Error resetting session:', resetError);
      return;
    }
    
    console.log('✅ Session reset to scheduled status');
    console.log('🎉 You can now start a fresh session with the correct QR code!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

completeCurrentSession();
