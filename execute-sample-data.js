const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function executeSampleData() {
  console.log('🎭 Executing sample data SQL...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('insert-sample-data.sql', 'utf8');
    console.log('📄 SQL file loaded successfully\n');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          // Use the REST API to execute SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (response.ok) {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          } else {
            const errorText = await response.text();
            console.log(`⚠️  Statement ${i + 1} had issues: ${response.status} - ${errorText}`);
            errorCount++;
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} failed: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 SQL Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Sample data execution completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Visit http://localhost:3000 to see the data in action');
      console.log('2. Check your Supabase dashboard to view the data');
      console.log('3. Test the QR code generation and scanning features');
      console.log('4. Test the analytics dashboard');
    } else {
      console.log('\n⚠️  Manual execution required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy the content from insert-sample-data.sql');
      console.log('4. Paste and execute it');
    }
    
  } catch (error) {
    console.log(`❌ Error executing sample data: ${error.message}`);
    console.log('\n💡 Manual execution required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the content from insert-sample-data.sql');
    console.log('4. Paste and execute it');
  }
}

executeSampleData();
