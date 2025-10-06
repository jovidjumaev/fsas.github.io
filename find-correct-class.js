// Find the correct class record for enrollment
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findCorrectClass() {
  console.log('🔍 Finding correct class record...\n');

  try {
    // Get prof user
    const { data: profUser, error: profError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('email', 'prof@furman.edu')
      .single();

    if (profError) {
      console.error('❌ Error fetching prof user:', profError);
      return;
    }

    console.log('✅ Prof user:', profUser.first_name, profUser.last_name, `(${profUser.id})`);

    // Get a class instance
    const { data: classInstance, error: classInstanceError } = await supabase
      .from('class_instances')
      .select(`
        id, 
        class_code,
        course_id,
        academic_period_id,
        courses!inner(
          id,
          code,
          name
        )
      `)
      .eq('professor_id', profUser.id)
      .limit(1)
      .single();

    if (classInstanceError) {
      console.error('❌ Error fetching class instance:', classInstanceError);
      return;
    }

    console.log('✅ Class Instance:', classInstance.class_code);
    console.log('   Course:', classInstance.courses.code, classInstance.courses.name);
    console.log('   Academic Period ID:', classInstance.academic_period_id);

    // Find all classes for this professor
    console.log('\n2️⃣ Finding all classes for this professor...');
    const { data: allClasses, error: allClassesError } = await supabase
      .from('classes')
      .select('id, code, name, academic_period_id, professor_id')
      .eq('professor_id', profUser.id);

    if (allClassesError) {
      console.error('❌ Error fetching classes:', allClassesError);
      return;
    }

    console.log(`✅ Found ${allClasses.length} classes for this professor:`);
    allClasses.forEach((cls, index) => {
      console.log(`   ${index + 1}. ${cls.code} - ${cls.name} (Period: ${cls.academic_period_id})`);
    });

    // Find matching class
    const matchingClass = allClasses.find(cls => 
      cls.code === classInstance.courses.code && 
      cls.academic_period_id === classInstance.academic_period_id
    );

    if (matchingClass) {
      console.log('\n✅ Found matching class!');
      console.log('   Class ID:', matchingClass.id);
      console.log('   Code:', matchingClass.code);
      console.log('   Name:', matchingClass.name);
    } else {
      console.log('\n❌ No matching class found!');
      console.log('   Looking for:', classInstance.courses.code, 'in period', classInstance.academic_period_id);
      
      // Check if there are any classes with the same code
      const sameCodeClasses = allClasses.filter(cls => cls.code === classInstance.courses.code);
      if (sameCodeClasses.length > 0) {
        console.log('   Classes with same code:');
        sameCodeClasses.forEach(cls => {
          console.log(`     - ${cls.code} (Period: ${cls.academic_period_id})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Find failed:', error.message);
  }
}

// Run the find
findCorrectClass();
