const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getVersion() {
  // 1. Check exact git tag if any
  try {
    const tag = execSync('git describe --tags --exact-match 2>/dev/null').toString().trim();
    if (tag) return tag.replace(/^v/, '');
  } catch {}

  // 2. Count feature/patch updates since v1.0.0 baseline (3362789)
  try {
    const featCount = parseInt(execSync('git log --grep="^feat" --oneline 3362789..HEAD | wc -l').toString().trim(), 10);
    if (!isNaN(featCount) && featCount >= 0) {
      return `1.0.${featCount}`;
    }
  } catch {}

  return '1.0.2';
}

const version = getVersion();
let commitHash = 'latest';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

let buildNumber = 62;
try {
  buildNumber = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10) || 62;
} catch {}

const versionData = {
  version,
  buildNumber,
  buildHash: commitHash,
  updatedAt: new Date().toISOString()
};

// Write version.json in root
const rootVersionPath = path.resolve(__dirname, '../version.json');
fs.writeFileSync(rootVersionPath, JSON.stringify(versionData, null, 2) + '\n');

// Sync client/package.json
const clientPkgPath = path.resolve(__dirname, '../client/package.json');
if (fs.existsSync(clientPkgPath)) {
  const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
  clientPkg.version = version;
  fs.writeFileSync(clientPkgPath, JSON.stringify(clientPkg, null, 2) + '\n');
}

// Sync server/package.json
const serverPkgPath = path.resolve(__dirname, '../server/package.json');
if (fs.existsSync(serverPkgPath)) {
  const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
  serverPkg.version = version;
  fs.writeFileSync(serverPkgPath, JSON.stringify(serverPkg, null, 2) + '\n');
}

console.log(`[Version Sync] Synced app version to v${version} (build #${buildNumber}, commit ${commitHash})`);
