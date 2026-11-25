import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'

// Remove `sourceContents` from the sourcemaps, as the source files are part of the package.
function removeContentsFromSourceMaps(path = new URL('../dist/', import.meta.url)) {
  for (const file of readdirSync(path)) {
    const url = new URL(file, path)
    if (statSync(url).isDirectory()) {
      removeContentsFromSourceMaps(new URL(`${file}/`, path))
    }
    else if (file.endsWith('js.map')) {
      const map = JSON.parse(readFileSync(url, 'utf8'))
      map.sourcesContent = []
      writeFileSync(url, JSON.stringify(map))
    }
  }
}

// Dev-only warnings must reach the published files behind `process.env.NODE_ENV`, which the consumer's
// bundler replaces. `import.meta.env` doesn't exist there: code behind it is cut at build time, or throws in CJS.
const DEV_WARNINGS = [
  'Missing resize handle for PanelGroup',
  'Unable to resolve contrast color',
  'createAgent ran after an app mounted',
]
const DEV_GUARD = 'process.env.NODE_ENV !== "production"'
const GUARD_LOOKBACK = 3

function checkDevWarnings(path = new URL('../dist/', import.meta.url), found = new Set<string>(), root = true) {
  for (const file of readdirSync(path)) {
    const url = new URL(file, path)
    if (statSync(url).isDirectory()) {
      checkDevWarnings(new URL(`${file}/`, path), found, false)
    }
    else if (file.endsWith('.js') || file.endsWith('.cjs')) {
      const code = readFileSync(url, 'utf8')
      if (code.includes('import.meta.env'))
        throw new Error(`[postbuild] ${url.pathname} still reads import.meta.env. Use process.env.NODE_ENV !== 'production' in src.`)
      const lines = code.split('\n')
      for (const [index, line] of lines.entries()) {
        const warning = DEV_WARNINGS.find(text => line.includes(text))
        if (!warning)
          continue
        // The guard is on the warning's own line, or opens a block a few lines above it.
        if (!lines.slice(Math.max(0, index - GUARD_LOOKBACK), index + 1).some(l => l.includes(DEV_GUARD)))
          throw new Error(`[postbuild] ${url.pathname}: the "${warning}" warning is not behind ${DEV_GUARD}, so it would also run in production.`)
        found.add(warning)
      }
    }
  }
  if (root) {
    const missing = DEV_WARNINGS.filter(text => !found.has(text))
    if (missing.length)
      throw new Error(`[postbuild] dev warnings missing from dist, the build stripped them: ${missing.join(', ')}`)
  }
}

removeContentsFromSourceMaps()
checkDevWarnings()
