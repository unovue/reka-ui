import { readFileSync, writeFileSync } from 'node:fs'
import { mergeExports } from './families.ts'

// Regenerates the per-family subpaths in `package.json#exports` from `src/index.ts`.
// Run with `pnpm --filter reka-ui gen:exports` after adding or removing a family in the barrel.
const url = new URL('../package.json', import.meta.url)
const pkg = JSON.parse(readFileSync(url, 'utf8'))
pkg.exports = mergeExports(pkg.exports)
writeFileSync(url, `${JSON.stringify(pkg, null, 2)}\n`)
