// frontend/scripts/obfuscate-build.js
// An toàn hơn: mặc định chỉ obfuscate main.*.js để không làm hỏng vendor/react/antd
// Đặt OBFUSCATE_ALL=true nếu bạn hiểu rủi ro và muốn obfuscate tất cả file js.

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const JavaScriptObfuscator = require('javascript-obfuscator');

const buildJsPath = path.join(__dirname, '..', 'build', 'static', 'js');

// Nếu muốn obfuscate toàn bộ, set OBFUSCATE_ALL=true (ví dụ: OBFUSCATE_ALL=true npm run postbuild:obfuscate)
const OBFUSCATE_ALL = (process.env.OBFUSCATE_ALL || '').toLowerCase() === 'true';

const pattern = OBFUSCATE_ALL
  ? path.join(buildJsPath, '*.js')           // nguy hiểm: sẽ bao gồm vendor/chunks
  : path.join(buildJsPath, 'main*.js');      // an toàn: chỉ obfuscate main.*.js

const files = glob.sync(pattern).filter(f => !f.endsWith('.map'));

if (!files.length) {
  console.log('No JS files found to obfuscate with pattern:', pattern);
  process.exit(0);
}

console.log(`Found ${files.length} JS file(s) to obfuscate.`);
console.log(`OBFUSCATE_ALL=${OBFUSCATE_ALL}. Pattern=${pattern}`);
console.log('Starting obfuscation (safer profile, logs enabled)...');

const startAll = Date.now();

files.forEach((file, idx) => {
  const basename = path.basename(file);
  try {
    console.log(`(${idx+1}/${files.length}) Reading ${basename} ...`);
    const code = fs.readFileSync(file, 'utf8');

    // Safer / faster config: tránh các tùy chọn cực nặng (controlFlowFlattening, deadCodeInjection)
    const obfuscationOptions = {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      rotateStringArray: true,
      stringArray: true,
      stringArrayThreshold: 0.6
    };

    console.log(`  → Obfuscating ${basename} (this may take a moment)...`);
    const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscationOptions).getObfuscatedCode();

    // Backup only if backup not exist yet
    const bak = `${file}.bak`;
    if (!fs.existsSync(bak)) {
      fs.copyFileSync(file, bak);
      console.log(`  → Backup created: ${path.basename(bak)}`);
    } else {
      console.log(`  → Backup already exists: ${path.basename(bak)}`);
    }

    fs.writeFileSync(file, obfuscated, 'utf8');
    const sizeKb = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`  ✅ Done ${basename} (${sizeKb} KB)`);
  } catch (err) {
    console.error(`  ❌ Error processing ${basename}: ${err && err.message}`);
  }
});

const totalSec = ((Date.now() - startAll) / 1000).toFixed(1);
console.log(`All done. Processed ${files.length} files in ${totalSec}s.`);
console.log('Backups: *.bak in the same folder. Remove them when you are sure everything is OK.');
