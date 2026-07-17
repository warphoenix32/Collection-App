const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function createContext(overrides = {}) {
  const context = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    Date,
    Math,
    Map,
    Set,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    Error,
    URL,
    setTimeout,
    clearTimeout,
    crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000000" },
    DCE: { discord: {}, renderers: {}, hosts: {} },
    ...overrides
  });
  context.globalThis = context;
  return context;
}

function load(contextOrRelativePath, relativePathOrGlobals) {
  const legacyCall = typeof contextOrRelativePath === "string";
  const context = legacyCall
    ? createContext(relativePathOrGlobals || {})
    : contextOrRelativePath;
  const relativePath = legacyCall
    ? contextOrRelativePath
    : relativePathOrGlobals;
  const filename = path.join(root, relativePath);
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
  return legacyCall ? context : context.DCE;
}

module.exports = { createContext, load, root };
