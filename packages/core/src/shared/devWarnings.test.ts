import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { ColorSwatch } from '@/ColorSwatch'
import { validatePanelConstraints } from '@/Splitter/utils/validation'

const SRC = join(__dirname, '..')
// Built from parts so this file doesn't match itself.
const BANNED = ['import', 'meta', 'env', 'DEV'].join('.')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory())
      return entry.name === 'node_modules' ? [] : sourceFiles(path)
    return /\.(?:ts|vue)$/.test(entry.name) ? [path] : []
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('dev warnings', () => {
  // The published build has no `import.meta.env`, so a warning behind it never reaches users.
  // `process.env.NODE_ENV !== 'production'` survives the build and is dropped by the consumer's bundler.
  // TODO(v3-port): #3382 v3 src still guards warnings with the Vite-only dev flag
  it.skip('should not guard anything in src with the Vite-only dev flag', () => {
    const offenders = sourceFiles(SRC)
      .filter(file => readFileSync(file, 'utf8').includes(BANNED))
      .map(file => relative(SRC, file))
    expect(offenders).toEqual([])
  })

  describe.each(['development', 'production'])('given NODE_ENV=%s', (mode) => {
    const warns = mode !== 'production'

    it(`should ${warns ? 'warn' : 'stay silent'} about invalid Splitter panel constraints`, () => {
      vi.stubEnv('NODE_ENV', mode)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const valid = validatePanelConstraints({
        panelConstraints: [{ minSize: 80, maxSize: 20 }],
        panelId: 'left',
        panelIndex: 0,
      })
      expect(valid).toBe(!warns)
      expect(warn).toHaveBeenCalledTimes(warns ? 1 : 0)
    })

    // TODO(v3-port): #3382 v3's useColorSwatch warns behind the Vite-only dev flag, so it ignores NODE_ENV=production
    ;(warns ? it : it.skip)(`should ${warns ? 'warn' : 'stay silent'} about a ColorSwatch color with no contrast`, async () => {
      vi.stubEnv('NODE_ENV', mode)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mount(ColorSwatch, { props: { color: 'not-a-color' } })
      await nextTick()
      expect(warn).toHaveBeenCalledTimes(warns ? 1 : 0)
    })
  })

  // TODO(v3-port): #3382 v3's useColorSwatch warns for transparent, 8-digit hex and hsl() colors
  it.skip('should not warn about a ColorSwatch with no color or a valid one', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(ColorSwatch, { props: { color: '' } })
    mount(ColorSwatch, { props: { color: '#16a372' } })
    mount(ColorSwatch, { props: { color: 'transparent' } })
    mount(ColorSwatch, { props: { color: '#16a37280' } })
    mount(ColorSwatch, { props: { color: 'hsl(120, 100%, 50%)' } })
    await nextTick()
    expect(warn).not.toHaveBeenCalled()
  })
})
