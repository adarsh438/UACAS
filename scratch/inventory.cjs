const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const componentsDir = path.join(__dirname, '../src/components');
const routesDir = path.join(__dirname, '../src/server/routes');
const files = walkSync(componentsDir).concat(walkSync(routesDir));

let inventory = {
  screens: [],
  apis: [],
  ai: []
};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const basename = path.basename(file);
  
  if (file.includes('routes') || file.includes('server.ts')) {
    const apiMatches = [...content.matchAll(/\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g)];
    apiMatches.forEach(m => {
      inventory.apis.push({ file: basename, method: m[1].toUpperCase(), route: m[2] });
    });
  }
  
  if (!file.includes('routes')) {
    if (!inventory.screens.includes(basename)) inventory.screens.push(basename);
  }
  
  // AI integrations
  if (content.match(/genai/i) || content.match(/GoogleGenerativeAI/i) || content.match(/anthropic/i) || content.match(/\/generate-draft/i) || content.match(/gemini/i) || content.match(/generateContent/i)) {
    inventory.ai.push({ file: basename });
  }
});

console.log(JSON.stringify(inventory, null, 2));
