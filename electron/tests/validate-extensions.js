const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'extensions', 'builtin');
const expected = ['ad-blocker', 'dark-reader', 'fed-gram', 'page-info'];
const filesFrom = (value) => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(filesFrom);
  if (value && typeof value === 'object') return Object.values(value).flatMap(filesFrom);
  return [];
};
for (const name of expected) {
  const dir = path.join(root, name);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  if (manifest.manifest_version !== 3) throw new Error(`${name}: manifest_version must be 3`);
  if (!manifest.name || !manifest.version || !manifest.description) throw new Error(`${name}: incomplete metadata`);
  const referenced = new Set();
  for (const key of ['icons', 'background', 'action', 'content_scripts', 'declarative_net_request']) {
    for (const value of filesFrom(manifest[key])) {
      if (/\.(js|html|css|json|png)$/i.test(value) && !value.includes('://')) referenced.add(value);
    }
  }
  for (const relative of referenced) {
    const target = path.resolve(dir, relative);
    if (!target.startsWith(path.resolve(dir) + path.sep)) throw new Error(`${name}: unsafe path ${relative}`);
    if (!fs.existsSync(target)) throw new Error(`${name}: missing referenced asset ${relative}`);
  }
  console.log(`extension_ok ${name} ${manifest.version}`);
}
console.log(`EXTENSIONS:PASS ${expected.length}/${expected.length}`);
