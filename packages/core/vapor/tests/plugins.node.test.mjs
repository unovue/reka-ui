// Node unit tests for the Vapor build's path handling and its sync with src: `node --test vapor/tests/plugins.node.test.mjs`
/* eslint-disable test/no-import-node-test -- runs under `node --test` (Node-side build code, no Vitest config) */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { core, createPaths, overrideFor, toPosix } from '../plugins.mjs'

test('matches Windows-style ids against a Windows source root', () => {
  const paths = createPaths('C:\\repo\\packages\\core\\src')
  for (const id of ['C:/repo/packages/core/src/Tooltip/TooltipContent.vue', 'C:\\repo\\packages\\core\\src\\Tooltip\\TooltipContent.vue', 'C:/repo/packages/core/src/Tooltip/TooltipContent.vue?vue&type=script&setup=true&lang.ts']) {
    assert.equal(paths.isSrc(id), true, id)
    assert.equal(paths.rel(id), 'Tooltip/TooltipContent.vue', id)
  }
  assert.equal(paths.isSrc('C:/repo/packages/core/srcfoo/A.vue'), false)
  assert.equal(paths.isSrc('C:/repo/packages/core/vapor/src/Primitive.ts'), false)
})

test('matches POSIX ids against a POSIX source root', () => {
  const paths = createPaths('/repo/packages/core/src/')
  assert.equal(paths.isSrc('/repo/packages/core/src/Dialog/DialogRoot.vue'), true)
  assert.equal(paths.rel('/repo/packages/core/src/Dialog/DialogRoot.vue'), 'Dialog/DialogRoot.vue')
  assert.equal(paths.isSrc('/repo/packages/core/vapor/src/Presence.ts'), false)
})

test('finds a module override from an id with either separator', () => {
  const id = resolve(core, 'src/Primitive/Primitive.ts')
  const expected = resolve(core, 'vapor/src/Primitive.ts')
  assert.equal(overrideFor(toPosix(id)), expected)
  assert.equal(overrideFor(id.replaceAll('/', '\\')), expected)
  assert.equal(overrideFor(`${toPosix(id)}?v=123`), expected)
  assert.equal(overrideFor(resolve(core, 'src/Dialog/DialogRoot.vue')), undefined)
})

test('prepares every context key that src parts claim with claimReferencedId', () => {
  const vapor = readFileSync(resolve(core, 'vapor/src/shared/useReferencedId.ts'), 'utf8')
  const prepared = new Set(JSON.parse(`[${/REFERENCED_KEYS = \[([^\]]*)\]/.exec(vapor)[1].replaceAll('\'', '"')}]`))
  const claimed = new Set()
  let calls = 0
  for (const file of readdirSync(resolve(core, 'src'), { recursive: true })) {
    if (!/\.(?:vue|ts)$/.test(file) || file.endsWith('.test.ts') || file.endsWith('useReferencedId.ts') || file.endsWith('index.ts'))
      continue
    const code = readFileSync(resolve(core, 'src', file), 'utf8')
    calls += code.match(/\bclaimReferencedId\(/g)?.length ?? 0
    // `reflect: false` claims are read with `getReferencedId`, which needs no getter.
    for (const m of code.matchAll(/claimReferencedId\([^,]+,\s*'(\w+)'\s*\)/g))
      claimed.add(m[1])
  }
  // Every call is recognised (none at all is fine: the parts may claim ids another way)
  assert.ok(claimed.size > 0 || calls === 0, 'claimReferencedId calls in src/ that this test does not parse')
  for (const key of claimed)
    assert.ok(prepared.has(key), `src claims '${key}': add it to REFERENCED_KEYS in vapor/src/shared/useReferencedId.ts`)
})
