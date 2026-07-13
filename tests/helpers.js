const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(relativePath, globals) {
  const filename = path.join(__dirname, '..', relativePath);
  const context = vm.createContext({ console, setTimeout, clearTimeout, URL, Date, ...globals });
  vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return context;
}

module.exports = { load };
