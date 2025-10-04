/**
 * Simple Password Table Setup
 * Creates the password tracking table using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPasswordTable() {
  try {
    console.log('🚀 Creating password tracking table...');
    
    // First, let's check if the table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('password_tracking')
      .select('id')
      .limit(1);
      
    if (!checkError) {
      console.log('✅ Table already exists');
      return;
    }
    
    console.log('📝 Table does not exist, creating it...');
    console.log('💡 Please run this SQL in Supabase SQL Editor:');
    console.log('');
    console.log('-- Create password tracking table');
    console.log('CREATE TABLE IF NOT EXISTS password_tracking (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,');
    console.log('    password_hash VARCHAR(255) NOT NULL,');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Create unique index');
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_password_tracking_hash ON password_tracking(password_hash);');
    console.log('');
    console.log('-- Create user index');
    console.log('CREATE INDEX IF NOT EXISTS idx_password_tracking_user_id ON password_tracking(user_id);');
    console.log('');
    console.log('-- Enable RLS');
    console.log('ALTER TABLE password_tracking ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- RLS Policies');
    console.log('CREATE POLICY "service_role_all" ON password_tracking');
    console.log('    FOR ALL TO service_role USING (true) WITH CHECK (true);');
    console.log('');
    console.log('CREATE POLICY "users_select_own" ON password_tracking');
    console.log('    FOR SELECT TO authenticated USING (auth.uid() = user_id);');
    console.log('');
    console.log('CREATE POLICY "users_insert_own" ON password_tracking');
    console.log('    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);');
    console.log('');
    console.log('CREATE POLICY "users_update_own" ON password_tracking');
    console.log('    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);');
    console.log('');
    console.log('-- Grant permissions');
    console.log('GRANT SELECT, INSERT, UPDATE ON password_tracking TO authenticated;');
    console.log('GRANT ALL ON password_tracking TO service_role;');
    console.log('');
    
    console.log('📋 After running the SQL:');
    console.log('1. The password uniqueness validation will work');
    console.log('2. Users cannot use the same password');
    console.log('3. Password hashes are tracked securely');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createPasswordTable();
