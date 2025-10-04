/**
 * Setup Password Tracking System
 * Run this script to create the password tracking table in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please check your .env file for:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPasswordTracking() {
  try {
    console.log('🚀 Setting up password tracking system...');
    
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'database', 'password-uniqueness-tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL script...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql_script: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try executing parts of the SQL manually
      console.log('🔄 Trying to create table manually...');
      
      // Create table
      const { error: tableError } = await supabase
        .from('password_tracking')
        .select('id')
        .limit(1);
        
      if (tableError && tableError.code === '42P01') {
        console.log('📝 Table does not exist, creating it...');
        
        // Execute table creation
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS password_tracking (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql_script: createTableSQL });
        
        if (createError) {
          console.error('❌ Error creating table:', createError);
          console.log('💡 Please run the SQL script manually in Supabase SQL Editor:');
          console.log('   database/password-uniqueness-tracking.sql');
          return;
        }
        
        console.log('✅ Table created successfully');
      } else {
        console.log('✅ Table already exists');
      }
      
      // Create unique index
      console.log('📝 Creating unique index...');
      const indexSQL = `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_password_tracking_hash 
        ON password_tracking(password_hash);
      `;
      
      const { error: indexError } = await supabase.rpc('exec_sql', { sql_script: indexSQL });
      
      if (indexError) {
        console.warn('⚠️ Could not create index automatically:', indexError.message);
        console.log('💡 Please create the index manually in Supabase SQL Editor');
      } else {
        console.log('✅ Index created successfully');
      }
      
    } else {
      console.log('✅ SQL script executed successfully');
    }
    
    // Test the table
    console.log('🧪 Testing password tracking table...');
    const { data: testData, error: testError } = await supabase
      .from('password_tracking')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('❌ Table test failed:', testError);
    } else {
      console.log('✅ Table is working correctly');
    }
    
    console.log('\n🎉 Password tracking system setup complete!');
    console.log('\n📋 What this enables:');
    console.log('• Prevents users from using the same password');
    console.log('• Tracks password hashes for uniqueness checking');
    console.log('• Maintains security by using SHA-256 hashes');
    console.log('• Works with existing Supabase Auth system');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n💡 Manual setup required:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the SQL script: database/password-uniqueness-tracking.sql');
    console.log('3. Verify the password_tracking table was created');
  }
}

setupPasswordTracking();
