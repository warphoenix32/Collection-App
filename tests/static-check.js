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
const extensionPages = ['popup.js', 'status.js', manifest.background?.service_worker].filter(Boolean);
for (const script of extensionPages) {
  const filename = path.join(root, script);
  if (!fs.existsSync(filename)) throw new Error(`Missing extension script: ${script}`);
  new vm.Script(fs.readFileSync(filename, 'utf8'), { filename: script });
}
for (const page of ['popup.html', 'status.html']) {
  if (!fs.existsSync(path.join(root, page))) throw new Error(`Missing extension page: ${page}`);
}
console.log(`Static check passed: ${scripts.length + extensionPages.length} JavaScript files and manifest validated.`);
