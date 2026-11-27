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

// Whether the code at `index` runs only under the nearest dev guard above it: either inside the block
// the guard opens, or in the single statement that follows it.
function isBehindDevGuard(code: string, index: number) {
  const guard = code.lastIndexOf(DEV_GUARD, index)
  if (guard === -1)
    return false
  let depth = 0
  let opened = false
  for (const char of code.slice(guard + DEV_GUARD.length, index)) {
    if (char === '{') {
      depth++
      opened = true
    }
    else if (char === '}') {
      depth--
    }
    // The guarded block closed, or the guarded statement ended, before the warning.
    if (depth < 0 || (opened && depth === 0) || (!opened && char === ';'))
      return false
  }
  return true
}

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
      for (const warning of DEV_WARNINGS) {
        for (let index = code.indexOf(warning); index !== -1; index = code.indexOf(warning, index + 1)) {
          if (!isBehindDevGuard(code, index))
            throw new Error(`[postbuild] ${url.pathname}: the "${warning}" warning is not behind ${DEV_GUARD}, so it would also run in production.`)
          found.add(warning)
        }
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
