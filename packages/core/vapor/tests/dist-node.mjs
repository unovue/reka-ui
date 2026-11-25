// Checks the built `reka-ui/vapor` from Node, through the package's own `exports` (self-reference):
// Node gets the documented SSR error for `import` and `require`, the files the exports name exist,
// and the declarations list every runtime export. Run after `pnpm build`: `node vapor/tests/dist-node.mjs`.
/* eslint-disable no-console, node/prefer-global/process, antfu/no-top-level-await */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const core = resolve(import.meta.dirname, '../..')
const require = createRequire(import.meta.url)
const SSR = 'reka-ui/vapor does not support server-side rendering'
let failed = 0
function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`)
  if (!ok)
    failed++
}
async function message(load) {
  try {
    await load()
    return 'loaded without an error'
  }
  catch (e) {
    return e.message
  }
}

check((await message(() => import('reka-ui/vapor'))).startsWith(SSR), 'import() in Node throws the SSR error')
check((await message(() => require('reka-ui/vapor'))).startsWith(SSR), 'require() in Node throws the SSR error')

const { exports } = JSON.parse(readFileSync(resolve(core, 'package.json'), 'utf8'))
for (const [condition, file] of Object.entries(exports['./vapor']))
  check(existsSync(resolve(core, file)), `exports["./vapor"].${condition} → ${file} exists`)
check(readFileSync(resolve(core, 'dist/vapor/index.cjs'), 'utf8').includes('ESM-only'), 'the require stub (bundlers) says the entry is ESM-only')

const entry = readFileSync(resolve(core, 'vapor/src/index.ts'), 'utf8')
const names = [...entry.matchAll(/export\s*\{([^}]*)\}/g)].flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean))
const dts = readFileSync(resolve(core, 'dist/vapor/index.d.ts'), 'utf8')
const js = readFileSync(resolve(core, 'dist/vapor/index.js'), 'utf8')
const missingTypes = names.filter(n => !dts.includes(`export declare const ${n}:`))
const missingJs = names.filter(n => !new RegExp(`\\b${n}\\b`).test(js))
check(!missingTypes.length, `index.d.ts declares all ${names.length} exports${missingTypes.length ? ` (missing ${missingTypes.join(', ')})` : ''}`)
check(!missingJs.length, `index.js exports all ${names.length} exports${missingJs.length ? ` (missing ${missingJs.join(', ')})` : ''}`)

process.exit(failed ? 1 : 0)
