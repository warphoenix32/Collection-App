const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const scripts = manifest.content_scripts.flatMap(item => item.js);
for (const script of scripts) {
  const filename = path.join(root, script);
  if (!fs.existsSync(filename)) throw new Error(`Missing manifest script: ${script}`);
  new vm.Script(fs.readFileSync(filename, 'utf8'), { filename });
}
for (const script of ['popup.js']) new vm.Script(fs.readFileSync(path.join(root, script), 'utf8'), { filename: script });
console.log(`Static check passed: ${scripts.length + 1} JavaScript files and manifest validated.`);
