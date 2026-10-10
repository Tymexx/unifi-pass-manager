import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

function getVersion() {
  try {
    const rootDir = import.meta.dirname || process.cwd()
    const vFile = path.resolve(rootDir, '../version.json')
    if (fs.existsSync(vFile)) {
      const parsed = JSON.parse(fs.readFileSync(vFile, 'utf8'))
      if (parsed.version) return parsed.version
    }
  } catch {}

  try {
    const featCount = parseInt(execSync('git log --grep="^feat" --oneline 3362789..HEAD | wc -l').toString().trim(), 10)
    if (!isNaN(featCount) && featCount >= 0) {
      return `1.0.${featCount}`
    }
  } catch {}

  return '1.0.2'
}

let commitHash = 'latest'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  commitHash = '1.0.2'
}

const appVersion = getVersion()
const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  server: {
    port: 5180,
    strictPort: true
  }
})
