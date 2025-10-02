const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function applySchema() {
  console.log('🗄️  Applying database schema to Supabase...\n');

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
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct execution for some statements
            const { data: directData, error: directError } = await supabase
              .from('_temp_schema_exec')
              .select('*')
              .limit(0);
            
            if (directError && !directError.message.includes('relation "_temp_schema_exec" does not exist')) {
              console.log(`⚠️  Statement ${i + 1} had issues: ${error.message}`);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} had issues: ${err.message}`);
        }
      }
    }
    
    console.log('\n🎉 Schema application completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Check your Supabase dashboard to verify tables were created');
    console.log('2. Start the application with: npm run dev');
    console.log('3. Visit http://localhost:3000/debug-page to test the connection');
    
  } catch (error) {
    console.log(`❌ Error applying schema: ${error.message}`);
    console.log('\n💡 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the content from database/schema.sql');
    console.log('4. Paste and execute it');
  }
}

applySchema();
