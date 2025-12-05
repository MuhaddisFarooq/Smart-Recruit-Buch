#!/usr/bin/env node
// Fix all image processing modules to support PNG transparency

const fs = require('fs').promises;
const path = require('path');

const modules = [
  { route: 'publications', folder: 'publications' },
  { route: 'publications/[id]', folder: 'publications' },
  { route: 'popups', folder: 'popup' },
  { route: 'popups/[id]', folder: 'popup' },
  { route: 'hr-training', folder: 'hr-training' },
  { route: 'hr-training/[id]', folder: 'hr-training' },
  { route: 'fertility-treatments', folder: 'fertility-treatments' },
  { route: 'fertility-treatments/[id]', folder: 'fertility-treatments' },
  { route: 'clinical-study', folder: 'clinical' },
  { route: 'clinical-study/[id]', folder: 'clinical' },
];

async function fixModule(routePath, folderName) {
  const filePath = path.join(__dirname, `../src/app/api/${routePath}/route.ts`);
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Skip if already updated
    if (content.includes('saveOptimizedImage')) {
      console.log(`✅ ${routePath} already updated`);
      return;
    }
    
    // Replace imports
    content = content.replace(
      /import sharp from "sharp";\s*\n/,
      ''
    );
    
    // Add our import
    const importIndex = content.indexOf('import { promises as fs } from "fs";\n');
    if (importIndex !== -1) {
      const insertPoint = importIndex + 'import { promises as fs } from "fs";\n'.length;
      content = content.slice(0, insertPoint) + 
        `import { saveOptimizedImage } from "../_helpers/image-processing";\n` +
        content.slice(insertPoint);
    }
    
    // Remove saveCompressedJpeg function
    content = content.replace(
      /async function saveCompressedJpeg\(file: File\): Promise<string> \{[\s\S]*?\n\}/,
      ''
    );
    
    // Replace usage
    content = content.replace(
      /await saveCompressedJpeg\(([^)]+)\)/g,
      `await saveOptimizedImage($1, "${folderName}")`
    );
    
    // Remove sanitize function if it exists and isn't used elsewhere
    if (!content.includes('sanitize(') || content.match(/sanitize\(/g)?.length === 1) {
      content = content.replace(
        /function sanitize\(n: string\) \{ return n\.replace\(\/\[\^a-zA-Z0-9\._-\]\+\/g, "_"\); \}\s*\n/,
        ''
      );
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ Fixed ${routePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${routePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Fixing image processing modules...\n');
  
  for (const { route, folder } of modules) {
    await fixModule(route, folder);
  }
  
  console.log('\n🎉 Done! All modules updated to support PNG transparency.');
}

main().catch(console.error);