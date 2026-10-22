// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'

describe('useId tree-shaking', () => {
  it('does not retain unrelated Vue exports in a production bundle', async () => {
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      resolve: {
        alias: {
          'vue': '\0vue',
          '@/ConfigProvider/ConfigProvider.vue': '\0config-provider',
        },
      },
      plugins: [{
        name: 'use-id-fixture',
        resolveId(id) {
          if (id.startsWith('\0'))
            return id
        },
        load(id) {
          if (id === '\0vue') {
            return `
              export function useId() { return 'native-id' }
              export function unusedRuntime() { console.log('UNUSED_VUE_RUNTIME') }
            `
          }
          if (id === '\0config-provider')
            return 'export function injectConfigProviderContext() { return {} }'
        },
      }],
      build: {
        write: false,
        minify: true,
        lib: {
          entry: fileURLToPath(new URL('./useId.ts', import.meta.url)),
          formats: ['es'],
        },
      },
    })

    const outputs = Array.isArray(result) ? result : [result]
    const code = outputs
      .flatMap((output) => {
        if (!('output' in output))
          throw new Error('Expected a bundle output')
        return output.output
      })
      .filter(output => output.type === 'chunk')
      .map(output => output.code)
      .join('\n')

    expect(code).toContain('native-id')
    expect(code).not.toContain('UNUSED_VUE_RUNTIME')
  })
})
