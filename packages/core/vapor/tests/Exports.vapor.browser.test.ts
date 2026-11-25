import * as reka from '#reka'
import { describe, expect, it } from 'vitest'
import entrySource from '../src/index.ts?raw'

declare const __VAPOR__: boolean

const EXPORT_LIST = /export\s*\{([^}]*)\}/g
const declared = [...entrySource.matchAll(EXPORT_LIST)].flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean)).sort()

describe('entry exports (Vapor)', () => {
  it.runIf(__VAPOR__)('exports exactly what vapor/src/index.ts lists, each defined', () => {
    expect(Object.keys(reka).sort()).toEqual(declared)
    for (const name of declared)
      expect(reka[name as keyof typeof reka], name).toBeDefined()
  })

  it('every listed export exists in the entry under test', () => {
    for (const name of declared)
      expect(name in reka, name).toBe(true)
  })
})

describe('vue version guard (Vapor)', () => {
  it.runIf(__VAPOR__)('accepts 3.6.0-rc.16 and later, rejects earlier releases', async () => {
    const { isSupportedVue } = await import('../src/shared/internals')
    for (const version of ['3.6.0-rc.16', '3.6.0-rc.17', '3.6.0', '3.6.1', '3.7.0-alpha.1', '4.0.0'])
      expect(isSupportedVue(version), version).toBe(true)
    for (const version of ['3.6.0-rc.15', '3.6.0-rc.2', '3.6.0-beta.9', '3.6.0-alpha.1', '3.5.46', '2.7.16', 'x'])
      expect(isSupportedVue(version), version).toBe(false)
  })
})
