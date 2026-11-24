// @vitest-environment node
import type { OutputChunk } from 'rolldown'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'

const ENTRY = 'virtual:lazy-content-entry'
const RESOLVED_ENTRY = `\0${ENTRY}`

const parts = {
  '@/Popover': ['PopoverRoot', 'PopoverTrigger', 'PopoverPortal', 'PopoverContent', 'PopoverArrow'],
  '@/Tooltip': ['TooltipProvider', 'TooltipRoot', 'TooltipTrigger', 'TooltipPortal', 'TooltipContent', 'TooltipArrow'],
  '@/HoverCard': ['HoverCardRoot', 'HoverCardTrigger', 'HoverCardPortal', 'HoverCardContent', 'HoverCardArrow'],
}

async function bundle(source: string, names: string[]) {
  const result = await build({
    configFile: fileURLToPath(new URL('../../vite.config.ts', import.meta.url)),
    logLevel: 'silent',
    plugins: [{
      name: 'lazy-content-entry',
      enforce: 'pre',
      resolveId: id => id === ENTRY ? RESOLVED_ENTRY : undefined,
      load: id => id === RESOLVED_ENTRY ? `import { ${names.join(', ')} } from '${source}'\nexport default [${names.join(', ')}]\n` : undefined,
    }],
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: ENTRY, external: ['vue'], preserveEntrySignatures: 'strict' },
    },
  })
  const output = (Array.isArray(result) ? result[0] : result) as { output: OutputChunk[] }
  const chunks = output.output.filter(chunk => chunk.type === 'chunk')
  const byName = new Map(chunks.map(chunk => [chunk.fileName, chunk]))
  const staticChunks = new Set<OutputChunk>()
  const visit = (chunk: OutputChunk) => {
    if (staticChunks.has(chunk))
      return
    staticChunks.add(chunk)
    chunk.imports.forEach(name => byName.has(name) && visit(byName.get(name)!))
  }
  visit(chunks.find(chunk => chunk.isEntry)!)

  const includesFloatingUi = (list: OutputChunk[]) => list.some(chunk => chunk.moduleIds.some(id => id.includes('@floating-ui')))
  return {
    static: includesFloatingUi([...staticChunks]),
    lazy: includesFloatingUi(chunks.filter(chunk => !staticChunks.has(chunk))),
  }
}

describe.each(Object.entries(parts))('given a bundle of %s', (source, names) => {
  it('should load @floating-ui/vue only with the content implementation', async () => {
    expect(await bundle(source, names)).toEqual({ static: false, lazy: true })
  }, 30_000)
})
