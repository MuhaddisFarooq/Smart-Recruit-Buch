const fs = require('fs');
const path = require('path');

const sourcePublic = path.join(__dirname, '..', 'public');
const destPublic = path.join(__dirname, '..', '.next', 'standalone', 'public');

const sourceStatic = path.join(__dirname, '..', '.next', 'static');
const destStatic = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

console.log('Packaging for Hostinger...');

if (fs.existsSync(sourcePublic)) {
  console.log('Copying public folder...');
  copyFolderSync(sourcePublic, destPublic);
}

if (fs.existsSync(sourceStatic)) {
  console.log('Copying .next/static folder...');
  copyFolderSync(sourceStatic, destStatic);
}

console.log('Done! Ready to upload .next/standalone to Hostinger.');
