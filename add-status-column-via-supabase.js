// Add status column to class_instances table via Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addStatusColumn() {
  console.log('🔧 Adding status column to class_instances table...\n');

  try {
    // Execute the SQL to add the status column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add status column to class_instances table
        ALTER TABLE class_instances 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed'));
        
        -- Add an index for better performance when filtering by status
        CREATE INDEX IF NOT EXISTS idx_class_instances_status ON class_instances(status);
        
        -- Update existing records to have 'active' status
        UPDATE class_instances 
        SET status = 'active' 
        WHERE status IS NULL;
      `
    });

    if (error) {
      console.error('❌ Error adding status column:', error);
      return;
    }

    console.log('✅ Status column added successfully!');
    console.log('   - Added status column with values: active, inactive, completed');
    console.log('   - Added index for better performance');
    console.log('   - Updated existing records to active status');

    // Verify the column was added
    const { data: testData, error: testError } = await supabase
      .from('class_instances')
      .select('id, class_code, status')
      .limit(1);

    if (testError) {
      console.error('❌ Error verifying column:', testError);
    } else {
      console.log('✅ Verification successful - status column is working');
      console.log('   Sample data:', testData);
    }

  } catch (error) {
    console.error('❌ Failed to add status column:', error.message);
  }
}

// Run the migration
addStatusColumn();
