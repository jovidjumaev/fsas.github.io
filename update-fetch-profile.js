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

function updateFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace user_profiles with users in fetchUserProfile
    const fetchProfileRegex = /\.from\('user_profiles'\)/g;
    
    if (fetchProfileRegex.test(content)) {
      content = content.replace(fetchProfileRegex, ".from('users')");
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated fetchUserProfile in ${filePath}`);
    } else {
      console.log(`⚠️  No user_profiles reference found in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🔄 Updating fetchUserProfile functions...\n');

filesToUpdate.forEach(updateFile);

console.log('\n✅ FetchUserProfile functions updated!');
