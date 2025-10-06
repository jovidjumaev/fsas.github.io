const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getCurrentAcademicPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  
  console.log(`Current date: ${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
  
  // Academic year periods
  if (month >= 8 && month <= 12) {
    return { name: `Fall ${year}`, year, semester: 'fall', is_current: true };
  } else if (month >= 1 && month <= 5) {
    return { name: `Spring ${year}`, year, semester: 'spring', is_current: true };
  } else if (month === 6) {
    return { name: `Summer I ${year}`, year, semester: 'summer_i', is_current: true };
  } else if (month === 7) {
    return { name: `Summer II ${year}`, year, semester: 'summer_ii', is_current: true };
  } else {
    return { name: `Fall ${year}`, year, semester: 'fall', is_current: true };
  }
}

async function updateCurrentPeriod() {
  console.log('Updating current academic period...');
  
  try {
    const currentPeriod = getCurrentAcademicPeriod();
    console.log('Current period based on date:', currentPeriod);
    
    // Set all periods to not current
    const { error: updateError } = await supabase
      .from('academic_periods')
      .update({ is_current: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (updateError) {
      console.error('Error updating periods:', updateError);
      return;
    }
    
    // Find the current period
    const { data: currentPeriodData, error: findError } = await supabase
      .from('academic_periods')
      .select('*')
      .eq('name', currentPeriod.name)
      .eq('year', currentPeriod.year)
      .eq('semester', currentPeriod.semester)
      .single();
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding current period:', findError);
      return;
    }
    
    if (currentPeriodData) {
      // Update existing period to be current
      const { data, error } = await supabase
        .from('academic_periods')
        .update({ is_current: true })
        .eq('id', currentPeriodData.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating current period:', error);
      } else {
        console.log('✅ Updated current period:', data);
      }
    } else {
      // Create new current period
      const { data, error } = await supabase
        .from('academic_periods')
        .insert({
          name: currentPeriod.name,
          year: currentPeriod.year,
          semester: currentPeriod.semester,
          start_date: `${currentPeriod.year}-08-15`,
          end_date: `${currentPeriod.year}-12-15`,
          is_current: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating current period:', error);
      } else {
        console.log('✅ Created current period:', data);
      }
    }
    
  } catch (err) {
    console.error('Error in updateCurrentPeriod:', err);
  }
}

// Run if called directly
if (require.main === module) {
  updateCurrentPeriod();
}

module.exports = { updateCurrentPeriod, getCurrentAcademicPeriod };
