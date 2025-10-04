#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Supabase API Keys Updater');
console.log('============================\n');
console.log('This script will help you update your Supabase API keys.\n');
console.log('📝 You need to get these keys from:');
console.log('   https://supabase.com/dashboard → Your Project → Settings → API\n');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateKeys() {
  try {
    console.log('Please paste your new Supabase keys:\n');
    
    const supabaseUrl = await question('1. Project URL (e.g., https://xxxxx.supabase.co): ');
    const anonKey = await question('2. Anon public key: ');
    const serviceKey = await question('3. Service role key: ');
    
    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.log('\n❌ All keys are required!');
      process.exit(1);
    }
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
      console.log('\n❌ Invalid Supabase URL format!');
      process.exit(1);
    }
    
    // Validate keys (should be JWT tokens)
    if (!anonKey.startsWith('eyJ') || !serviceKey.startsWith('eyJ')) {
      console.log('\n❌ Keys should be JWT tokens starting with "eyJ"!');
      process.exit(1);
    }
    
    console.log('\n📝 Updating .env.local file...');
    
    const envPath = path.join(__dirname, '.env.local');
    let envContent;
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update existing keys
      envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_URL=.*/,
        `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`
      );
      envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`
      );
      envContent = envContent.replace(
        /SUPABASE_SERVICE_ROLE_KEY=.*/,
        `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`
      );
    } else {
      // Create new .env.local
      envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001

# Security
JWT_SECRET=your_jwt_secret_key_here
QR_SECRET=your_qr_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Geofencing (Furman University coordinates)
CLASSROOM_LAT=34.9224
CLASSROOM_LNG=-82.4365
GEOFENCE_RADIUS=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Development
NODE_ENV=development
`;
    }
    
    // Backup old file
    if (fs.existsSync(envPath)) {
      fs.writeFileSync(envPath + '.backup', fs.readFileSync(envPath));
      console.log('✅ Created backup: .env.local.backup');
    }
    
    // Write updated file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local file');
    
    // Update src/lib/supabase.ts with new keys
    const supabaseTsPath = path.join(__dirname, 'src/lib/supabase.ts');
    if (fs.existsSync(supabaseTsPath)) {
      let supabaseTsContent = fs.readFileSync(supabaseTsPath, 'utf8');
      
      supabaseTsContent = supabaseTsContent.replace(
        /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \|\| '.*?';/,
        `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '${supabaseUrl}';`
      );
      supabaseTsContent = supabaseTsContent.replace(
        /const supabaseAnonKey = process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY \|\| '.*?';/,
        `const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '${anonKey}';`
      );
      supabaseTsContent = supabaseTsContent.replace(
        /const supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY \|\| '.*?';/,
        `const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '${serviceKey}';`
      );
      
      fs.writeFileSync(supabaseTsPath, supabaseTsContent);
      console.log('✅ Updated src/lib/supabase.ts');
    }
    
    console.log('\n🎉 Keys updated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development servers:');
    console.log('   - Stop the current servers (Ctrl+C)');
    console.log('   - Run: npm run dev');
    console.log('2. Try signing in at: http://localhost:3000/student/login');
    console.log('\n✨ Test credentials:');
    console.log('   Email: test.student@furman.edu');
    console.log('   Password: TestPass123!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

updateKeys();

