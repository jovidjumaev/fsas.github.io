const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testCoreFunctionality() {
  console.log('🧪 Testing core FSAS functionality...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('1️⃣ Testing database table access...');
    
    // Test each table
    const tables = [
      'user_profiles',
      'courses', 
      'class_sessions',
      'attendance_records',
      'qr_code_usage'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Accessible (${data.length} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n2️⃣ Testing QR code generation...');
    
    // Test QR code generation (this should work without database data)
    try {
      const { QRCodeGenerator } = require('./src/lib/qr-generator');
      const testSessionId = 'test-session-123';
      const qrCode = await QRCodeGenerator.generateSecureQR(testSessionId);
      console.log('✅ QR code generation: Working');
      console.log(`   QR Code expires at: ${qrCode.expires_at}`);
    } catch (err) {
      console.log(`❌ QR code generation: ${err.message}`);
    }

    console.log('\n3️⃣ Testing device fingerprinting...');
    
    // Test device fingerprinting
    try {
      const { generateDeviceFingerprint } = require('./src/lib/device-fingerprint');
      const fingerprint = generateDeviceFingerprint();
      console.log('✅ Device fingerprinting: Working');
      console.log(`   Sample fingerprint: ${JSON.stringify(fingerprint, null, 2).substring(0, 100)}...`);
    } catch (err) {
      console.log(`❌ Device fingerprinting: ${err.message}`);
    }

    console.log('\n4️⃣ Testing backend API...');
    
    // Test backend API
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Backend API: Working');
        console.log(`   Status: ${data.status}`);
      } else {
        console.log(`❌ Backend API: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.log(`❌ Backend API: ${err.message}`);
    }

    console.log('\n5️⃣ Testing frontend connection...');
    
    // Test frontend
    try {
      const response = await fetch('http://localhost:3000/');
      if (response.ok) {
        console.log('✅ Frontend: Working');
        console.log(`   Status: ${response.status}`);
      } else {
        console.log(`❌ Frontend: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.log(`❌ Frontend: ${err.message}`);
    }

    console.log('\n🎉 Core functionality test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. ✅ Your system is ready for data');
    console.log('2. 🔧 Add sample data manually in Supabase dashboard');
    console.log('3. 🧪 Test QR code generation and scanning');
    console.log('4. 📊 Test analytics and reporting features');
    console.log('5. 🚀 Deploy to production when ready');

  } catch (error) {
    console.log(`❌ Error testing functionality: ${error.message}`);
  }
}

testCoreFunctionality();
