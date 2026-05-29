import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const root = path.resolve(__dirname, '..');
const sourcePath = path.resolve(root, '../release/wechat-miniprogram/data/content.js');
const outputPath = path.resolve(root, 'src/data/release-content.json');

if (!fs.existsSync(sourcePath)) {
  if (fs.existsSync(outputPath)) {
    console.log(
      `Release source not found at ${path.relative(root, sourcePath)}; using existing ${path.relative(root, outputPath)}`,
    );
    process.exit(0);
  }

  console.error(`Release source not found: ${sourcePath}`);
  console.error(`Bundled content snapshot is also missing: ${outputPath}`);
  console.error('Restore src/data/release-content.json or run this script in the full sanxingdui-guide repo.');
  process.exit(1);
}

const content = require(sourcePath);
fs.writeFileSync(outputPath, `${JSON.stringify(content, null, 2)}\n`);

console.log(`Synced release content to ${path.relative(root, outputPath)}`);
