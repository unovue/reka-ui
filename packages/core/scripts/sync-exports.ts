import { readFileSync, writeFileSync } from 'node:fs'
import { syncPackageJson } from './families.ts'

// Regenerates the per-family subpaths in `package.json#exports` and `#typesVersions` from `src/index.ts`.
// Run with `pnpm --filter reka-ui gen:exports` after adding or removing a family in the barrel.
const url = new URL('../package.json', import.meta.url)
const pkg = JSON.parse(readFileSync(url, 'utf8'))
writeFileSync(url, `${JSON.stringify(syncPackageJson(pkg), null, 2)}\n`)
