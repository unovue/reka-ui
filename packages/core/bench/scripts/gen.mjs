// Writes one fixture SFC per family (src/families.js) for one build of reka-ui, into the run's
// own directory (so two runs never share generated files):
//   <out>/<Family>.vue   N instances of the family's composition, each wrapped in <div class="ci">
//   <out>/index.js       { fixtures, missing }: families whose parts this build doesn't export are
//                        reported as missing instead of mounting garbage
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FAMILIES } from '../src/families.js'

const DATA = fileURLToPath(new URL('../src/data.js', import.meta.url))
const TAG = /<([A-Z][A-Za-z0-9]*)/g
const AS = /\s+as\s+/
const EXPORT_BLOCK = /export\s*\{([^}]*)\}/g

// Names exported by <lib>/dist/index.js.
export function libExports(lib) {
  const src = readFileSync(resolve(lib, 'dist/index.js'), 'utf8')
  const names = new Set()
  for (const m of src.matchAll(EXPORT_BLOCK)) {
    for (const part of m[1].split(','))
      names.add(part.trim().split(AS).pop())
  }
  return names
}

export function generate({ lib, kind, out }) {
  const exported = libExports(lib)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  const present = []
  const missing = {}
  for (const [name, f] of Object.entries(FAMILIES)) {
    const body = f[kind] ?? f.body
    const [open, close] = f.outer ?? ['', '']
    const tags = [...new Set(Array.from(`${open}${body ?? ''}${close}`.matchAll(TAG), m => m[1]))]
      .filter(t => !f.locals?.includes(t))
      .sort()
    const absent = body ? tags.filter(t => !exported.has(t)) : ['(no composition for this major)']
    if (absent.length) {
      missing[name] = absent
      continue
    }
    present.push(name)
    writeFileSync(resolve(out, `${name}.vue`), `<script setup>
// ${name}: generated from bench/src/families.js by bench/scripts/gen.mjs. Do not edit.
import { ${tags.join(', ')} } from 'reka-ui'
import { computed, defineComponent, h } from 'vue'
import { folderKeys, makeOpts, makeTree } from ${JSON.stringify(DATA)}
${f.date ? `import { endDate, endTime, startDate, startTime } from 'virtual:bench-date'` : ''}

const props = defineProps({ n: { type: Number, default: 1 }, items: { type: Number, default: ${f.items ?? 5} } })
const opts = computed(() => makeOpts(props.items))
const tree = computed(() => makeTree(props.items))
const expanded = computed(() => folderKeys(tree.value))
${f.script ?? ''}
</script>

<template>
  ${open}<div v-for="i in n" :key="i" class="ci">${body}
  </div>${close}
</template>
`)
  }
  writeFileSync(resolve(out, 'index.js'), `${present.map(n => `import ${n} from './${n}.vue'`).join('\n')}

export const fixtures = { ${present.join(', ')} }
export const missing = ${JSON.stringify(missing)}
`)
  return { present, missing }
}
