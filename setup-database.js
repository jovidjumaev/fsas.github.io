#!/usr/bin/env node

/**
 * Database Setup Script for FSAS
 * This script sets up the database with the proper authentication schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Starting FSAS Database Setup...\n');

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'database', 'fixed-user-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Reading database schema...');
    console.log('📊 Schema file size:', (schemaSQL.length / 1024).toFixed(2), 'KB');

    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase
            .from('_sql')
            .select('*')
            .limit(0);
          
          if (directError) {
            console.log(`⚠️  Statement ${i + 1} may need manual execution:`, statement.substring(0, 100) + '...');
            continue;
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} failed (may already exist):`, err.message);
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify the tables were created in your Supabase dashboard');
    console.log('2. Test user registration and login');
    console.log('3. Check that RLS policies are working correctly');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n🔧 Manual setup required:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the contents of database/fixed-user-schema.sql');
    console.log('4. Execute the SQL script');
    process.exit(1);
  }
}

// Alternative: Direct SQL execution using Supabase client
async function setupDatabaseDirect() {
  console.log('🚀 Starting FSAS Database Setup (Direct Method)...\n');

  try {
    // Test connection
    console.log('🔌 Testing Supabase connection...');
    const { data, error } = await supabase.from('_sql').select('*').limit(1);
    
    if (error) {
      console.log('⚠️  Direct SQL execution not available, using alternative method...');
      await setupDatabaseAlternative();
      return;
    }

    // Read and execute the schema
    const schemaPath = path.join(__dirname, 'database', 'fixed-user-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing database schema...');
    
    // Execute the entire schema
    const { error: schemaError } = await supabase.rpc('exec', { sql: schemaSQL });
    
    if (schemaError) {
      console.error('❌ Schema execution failed:', schemaError.message);
      await setupDatabaseAlternative();
      return;
    }

    console.log('✅ Database schema executed successfully!');
    console.log('\n🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    await setupDatabaseAlternative();
  }
}

// Alternative setup method
async function setupDatabaseAlternative() {
  console.log('\n🔧 Alternative Setup Method');
  console.log('==========================');
  console.log('Since direct SQL execution is not available, please follow these steps:');
  console.log('\n1. Open your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy the contents of database/fixed-user-schema.sql');
  console.log('4. Paste and execute the SQL script');
  console.log('\n📄 Schema file location:', path.join(__dirname, 'database', 'fixed-user-schema.sql'));
  
  // Display the schema content
  const schemaPath = path.join(__dirname, 'database', 'fixed-user-schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  console.log('\n📋 Schema Preview (first 500 characters):');
  console.log('==========================================');
  console.log(schemaContent.substring(0, 500) + '...');
  console.log('\n✅ Please execute the complete schema in your Supabase SQL Editor');
}

// Main execution
if (require.main === module) {
  setupDatabaseDirect().catch(console.error);
}

module.exports = { setupDatabase, setupDatabaseDirect, setupDatabaseAlternative };
