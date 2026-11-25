// Node unit tests for the Vapor build's path handling: `node --test vapor/tests/plugins.node.test.mjs`
/* eslint-disable test/no-import-node-test -- runs under `node --test` (Node-side build code, no Vitest config) */
import assert from 'node:assert/strict'
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
