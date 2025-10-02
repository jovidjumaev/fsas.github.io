const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function applySchemaViaAPI() {
  console.log('🗄️  Applying database schema via Supabase API...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials!');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read the schema file
    const schema = fs.readFileSync('database/schema.sql', 'utf8');
    console.log('📄 Schema file loaded successfully\n');
    
    // Split into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          // Use the REST API to execute SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
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
    
    console.log(`\n📊 Schema Application Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Schema application completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Check your Supabase dashboard to verify tables were created');
      console.log('2. Test the application with: npm run dev');
      console.log('3. Visit http://localhost:3000/debug-page to test the connection');
    } else {
      console.log('\n⚠️  Manual setup required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy the content from database/schema.sql');
      console.log('4. Paste and execute it');
    }
    
  } catch (error) {
    console.log(`❌ Error applying schema: ${error.message}`);
    console.log('\n💡 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the content from database/schema.sql');
    console.log('4. Paste and execute it');
  }
}

applySchemaViaAPI();
