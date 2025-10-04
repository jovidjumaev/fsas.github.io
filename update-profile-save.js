const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'src/app/student/attendance/page.tsx',
  'src/app/student/schedule/page.tsx', 
  'src/app/student/classes/page.tsx',
  'src/app/student/scan/page.tsx',
  'src/app/student/dashboard/page_new.tsx',
  'src/app/student/dashboard/page_old.tsx'
];

// New handleProfileSave function
const newProfileSaveFunction = `  const handleProfileSave = async (profileData: any) => {
    if (!user) return;
    
    try {
      console.log('Attempting to save profile data:', profileData);
      console.log('User ID:', user.id);
      
      // Update the users table (this is the correct table)
      const { error: usersError } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id);
      
      if (usersError) {
        console.error('Error updating users table:', usersError);
        throw new Error(\`Failed to save profile: \${usersError.message}\`);
      }
      
      console.log('Profile updated successfully in users table');
      
      // Also update auth metadata for consistency
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          office_location: profileData.office_location,
          title: profileData.title
        }
      });
      
      if (authError) {
        console.warn('Warning: Could not update auth metadata:', authError.message);
        // Don't throw error here, as the main update succeeded
      }
      
      // Update local state
      setUserProfile((prev: any) => ({ ...prev, ...profileData }));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };`;

function updateFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Find and replace the handleProfileSave function
    const functionRegex = /const handleProfileSave = async \(profileData: any\) => \{[\s\S]*?\};/g;
    
    if (functionRegex.test(content)) {
      content = content.replace(functionRegex, newProfileSaveFunction);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚠️  No handleProfileSave function found in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🔄 Updating profile save functions...\n');

filesToUpdate.forEach(updateFile);

console.log('\n✅ Profile save functions updated!');
