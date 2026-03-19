const fs = require('fs-extra');
const path = require('path');

// Check if this is a library build
if (process.env.LIBRARY_BUILD) {
  const srcPath = path.join(__dirname, '../projects/your-library-name/src/generated');
  const destPath = path.join(__dirname, '../dist/your-library-name/generated');

  fs.copy(srcPath, destPath)
    .then(() => console.log('Generated folder copied successfully!'))
    .catch(err => console.error('Error copying generated folder:', err));
} else {
  console.log('Skipping generated folder copy; not a library build.');
}