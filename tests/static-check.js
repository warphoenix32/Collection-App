const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const jsFiles = walk(root).filter(file => file.endsWith(".js") && !file.includes(`${path.sep}node_modules${path.sep}`));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`${path.relative(root, file)}: ${result.stderr.trim()}`);
}

const declaredScripts = manifest.content_scripts.flatMap(entry => entry.js || []);
for (const script of declaredScripts) {
  if (!fs.existsSync(path.join(root, script))) failures.push(`Manifest script does not exist: ${script}`);
}

const duplicateScripts = declaredScripts.filter((value, index) => declaredScripts.indexOf(value) !== index);
if (duplicateScripts.length) failures.push(`Manifest declares duplicate scripts: ${[...new Set(duplicateScripts)].join(", ")}`);

const coreAndPlatform = walk(path.join(root, "src")).filter(file => file.endsWith(".js") && /[\\/]src[\\/](core|platform)[\\/]/.test(file));
for (const file of coreAndPlatform) {
  const source = fs.readFileSync(file, "utf8");
  if (/discord/i.test(source)) failures.push(`Reusable module contains Discord coupling: ${path.relative(root, file)}`);
}

const popupHtml = fs.readFileSync(path.join(root, "popup.html"), "utf8");
const popupJs = fs.readFileSync(path.join(root, "popup.js"), "utf8");
for (const match of popupJs.matchAll(/\$\(['"]([^'"]+)['"]\)/g)) {
  if (!new RegExp(`id=["']${match[1]}["']`).test(popupHtml)) failures.push(`popup.js references missing element #${match[1]}`);
}

if (manifest.version !== "4.0.1") failures.push(`Expected manifest version 4.0.1, received ${manifest.version}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Static validation passed: ${jsFiles.length} JavaScript files, ${declaredScripts.length} manifest scripts.`);
