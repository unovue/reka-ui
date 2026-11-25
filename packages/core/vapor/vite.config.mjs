/* eslint-disable e18e/prefer-static-regex, no-cond-assign, no-console, node/prefer-global/process, regexp/no-contradiction-with-assertion -- spike build script */
// SPIKE: builds the experimental `reka-ui/vapor` entry into `dist-vapor/`.
//
// The repo pins Vue 3.5, which has no Vapor compiler, so this config loads `@vitejs/plugin-vue` and
// `vue/compiler-sfc` from a Vue 3.6 toolchain (default: ../reka-vapor-check next to the repo; override
// with VUE_VAPOR_TOOLCHAIN). Run it with that toolchain's vite:
//
//   node $VUE_VAPOR_TOOLCHAIN/node_modules/vite/bin/vite.js build -c packages/core/vapor/vite.config.mjs
//
// What it does:
//   1. compiles the *unchanged* v2 SFCs from `src/` with `features.vapor` (same source, second output);
//   2. swaps the VDOM-only modules for Vapor versions (MODULE_OVERRIDES);
//   3. rewrites `<Primitive>`'s default `<slot>` so `asChild` slot props reach the consumer
//      (`asChildSlotProps`), a build-time stand-in for editing ~259 templates by hand.
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const core = resolve(here, '..')
const toolchain = process.env.VUE_VAPOR_TOOLCHAIN || resolve(core, '../../../reka-vapor-check')
const req = createRequire(resolve(toolchain, 'package.json'))
const { default: vue } = await import(pathToFileURL(req.resolve('@vitejs/plugin-vue')).href)
const compiler = req('vue/compiler-sfc')
// Cross-file prop types (`extends PrimitiveProps`) need TypeScript; use the repo's copy
compiler.registerTS(() => createRequire(resolve(core, 'package.json'))('typescript'))

const src = p => resolve(core, 'src', p)
const MODULE_OVERRIDES = {
  [src('Primitive/Primitive.ts')]: resolve(here, 'src/Primitive.ts'),
  [src('Presence/Presence.ts')]: resolve(here, 'src/Presence.ts'),
  [src('Collection/Collection.ts')]: resolve(here, 'src/Collection.ts'),
  [src('shared/useForwardExpose.ts')]: resolve(here, 'src/shared/useForwardExpose.ts'),
  [src('shared/useForwardScopeId.ts')]: resolve(here, 'src/shared/forwarding.ts'),
  [src('shared/useForwardProps.ts')]: resolve(here, 'src/shared/forwarding.ts'),
  [src('shared/useEmitAsProps.ts')]: resolve(here, 'src/shared/forwarding.ts'),
  [src('shared/useTriggerId.ts')]: resolve(here, 'src/shared/useTriggerId.ts'),
}

function overrides() {
  return {
    name: 'reka-vapor-overrides',
    enforce: 'pre',
    async resolveId(id, importer, opts) {
      if (!importer || id.includes('?'))
        return null
      // reka's own imports of VueUse go through the Vapor-safe shim (src/shared/vueuse.ts)
      if ((id === '@vueuse/core' || id === '@vueuse/shared') && importer.startsWith(resolve(core, 'src')))
        return resolve(here, 'src/shared/vueuse.ts')
      const r = await this.resolve(id, importer, { ...opts, skipSelf: true })
      return r && MODULE_OVERRIDES[r.id] ? MODULE_OVERRIDES[r.id] : null
    },
  }
}

const stats = { files: 0, chains: 0, slotProps: 0 }

/** End index of the tag that opens at `start`, skipping `>` inside quoted attribute values. */
function tagEnd(code, start) {
  let quote = null
  for (let i = start; i < code.length; i++) {
    const c = code[i]
    if (quote) {
      if (c === quote)
        quote = null
    }
    else if (c === '"' || c === '\'') {
      quote = c
    }
    else if (c === '>') {
      return i
    }
  }
  return -1
}

/**
 * `<Primitive …><slot :x="…" /></Primitive>` → `<Primitive … v-slot="__rkc"><slot v-bind="__rkc" :x="…" /></Primitive>`
 * so the `props` Primitive hands its slot in `asChild` mode reach the consumer's slot. Only the first
 * Primitive (or `<component :is>` that may be Primitive) of each template is rewritten.
 */
function asChildSlotProps(code) {
  const tplStart = code.indexOf('<template>')
  if (tplStart < 0)
    return code
  const open = /<(Primitive|component)\b/g
  open.lastIndex = tplStart
  let m
  while ((m = open.exec(code))) {
    const tag = m[1]
    const end = tagEnd(code, m.index)
    const head = code.slice(m.index, end + 1)
    if (tag === 'component' && !/:is="[^"]*Primitive/.test(head))
      continue
    if (head.endsWith('/>') || /\sv-slot|\s#default/.test(head))
      return code
    // matching close tag
    const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g')
    re.lastIndex = end
    let depth = 1
    let close = -1
    let t
    while ((t = re.exec(code))) {
      depth += t[0].startsWith('</') ? -1 : 1
      if (depth === 0) {
        close = t.index
        break
      }
    }
    if (close < 0)
      return code
    stats.slotProps++
    const inner = code.slice(end + 1, close).replace(/<slot\b(?![^>]*\b(?:name=|v-bind=))/g, '<slot v-bind="__rkc"')
    return `${code.slice(0, end)} v-slot="__rkc"${code.slice(end, end + 1)}${inner}${code.slice(close)}`
  }
  return code
}

/**
 * Per-file template patches: the edits the real migration would make by hand.
 * - A component whose root is `Presence` (a `<slot>` root in Vapor) gets no attrs fallthrough in Vapor,
 *   so it forwards `$attrs` explicitly. Both edits are VDOM-neutral.
 */
const PATCHES = {
  // VNode cloning (`cloneVNode(slotVNode, rowAttrs)`) becomes an `asChild` Primitive per row
  [src('Listbox/ListboxVirtualizer.vue')]: [
    [/const virtualizedItems = computed\(\(\) => virtualizer\.value\.getVirtualItems\(\)\.map\(\(item\) => \{[\s\S]*?\n\}\)\)\n/, `const virtualItems = computed(() => virtualizer.value.getVirtualItems())
function rowAttrs(item: VirtualItem) {
  return {
    'data-index': item.index,
    'aria-setsize': props.options.length,
    'aria-posinset': item.index + 1,
    'style': { position: 'absolute', top: 0, left: 0, transform: \`translateY(\${item.start}px)\`, overflowAnchor: 'none' },
  }
}
`],
    ['import { useCollection } from \'@/Collection\'', 'import { useCollection } from \'@/Collection\'\nimport { Primitive } from \'@/Primitive\''],
    [/<component\s+:is="is"\s+v-for="\{ is, item \} in virtualizedItems"\s+:key="item.index"\s*\/>/, `<Primitive v-for="item in virtualItems" :key="item.index" as-child v-bind="rowAttrs(item)">
      <slot :option="props.options[item.index]" :virtualizer="virtualizer" :virtual-item="item" />
    </Primitive>`],
  ],
  [src('Popover/PopoverContent.vue')]: [
    ['<script setup lang="ts">', '<script setup lang="ts">\ndefineOptions({ inheritAttrs: false })'],
    ['      v-bind="forwarded"', '      v-bind="{ ...forwarded, ...$attrs }"'],
  ],
}

function applyPatches(code, id) {
  for (const [from, to] of PATCHES[id] ?? []) {
    if (from instanceof RegExp ? !from.test(code) : !code.includes(from))
      throw new Error(`[reka-vapor] patch for ${id} no longer applies: ${from}`)
    code = code.replace(from, to)
  }
  return code
}

/**
 * `asChild` onto a *component* (`<FocusScope as-child><DismissableLayer as-child><PopperContent>`):
 * DOM adoption would put the attrs on the child's root element (PopperContent's wrapper div), but in
 * VDOM they become the child component's props/attrs. So when an `as-child` component's slot holds a
 * single component, hand the attrs on with the scoped-slot `props`, before the child's own bindings
 * (child wins, like v2's `mergeProps(attrs, child.props)`):
 *   <A as-child><B :x="1" /></A>  →  <A as-child v-slot="{ props: __rkp0 }"><B v-bind="__rkp0" :x="1" /></A>
 */

function asChildComponentChains(code) {
  const tplStart = code.indexOf('<template>')
  if (tplStart < 0)
    return code
  const open = /<([A-Z][\w.]*|component)\b/g
  let n = 0
  open.lastIndex = tplStart
  let m
  while ((m = open.exec(code))) {
    const tag = m[1]
    const end = tagEnd(code, m.index)
    const head = code.slice(m.index, end + 1)
    // CollectionSlot / CollectionItem always render their child as-child
    const implicit = tag === 'CollectionSlot' || tag === 'CollectionItem'
    if ((!implicit && !/\sas-child(?=[\s>/=])/.test(head)) || /\s(?:as-child="false"|:as-child=)/.test(head) || head.endsWith('/>') || /\s__rkp(?=[\s>])|props: __rkp/.test(head))
      continue
    // matching close tag of the as-child component
    const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g')
    re.lastIndex = end
    let depth = 1
    let close = -1
    let t
    while ((t = re.exec(code))) {
      if (!t[0].startsWith('</') && code[tagEnd(code, t.index) - 1] === '/')
        continue
      depth += t[0].startsWith('</') ? -1 : 1
      if (depth === 0) {
        close = t.index
        break
      }
    }
    if (close < 0)
      continue
    const inner = code.slice(end + 1, close)
    const childMatch = /^\s*<([A-Z][\w.]*|component)\b/.exec(inner)
    if (!childMatch)
      continue
    const childStart = end + 1 + childMatch.index + childMatch[0].indexOf('<')
    const childEnd = tagEnd(code, childStart)
    // the child must be the only root of the slot
    let childClose = childEnd
    if (code[childEnd - 1] !== '/') {
      const cre = new RegExp(`<${childMatch[1]}\\b|</${childMatch[1]}>`, 'g')
      cre.lastIndex = childEnd
      let d = 1
      while ((t = cre.exec(code))) {
        if (!t[0].startsWith('</') && code[tagEnd(code, t.index) - 1] === '/')
          continue
        d += t[0].startsWith('</') ? -1 : 1
        if (d === 0) {
          childClose = tagEnd(code, t.index)
          break
        }
      }
    }
    if (code.slice(childClose + 1, close).trim())
      continue
    const name = `__rkp${n++}`
    stats.chains++
    let childHead = code.slice(childStart, childEnd + 1)
    const ownBind = /\sv-bind="([^"]*)"/.exec(childHead)
    childHead = ownBind
      ? childHead.replace(ownBind[0], ` v-bind="{ ...${name}, ...(${ownBind[1]}) }"`)
      : childHead.replace(/^<[\w.]+/, s => `${s}\n v-bind="${name}"`)
    let parentHead = head
    const slot = /\s(?:v-slot|#default)="([^"]*)"/.exec(head)
    let ref = name
    if (!slot) {
      parentHead = head.replace(/^<[\w.]+/, s => `${s} v-slot="{ props: ${name} }"`)
    }
    else if (slot[1].trim().startsWith('{')) {
      parentHead = head.replace(slot[0], slot[0].replace('{', `{ props: ${name}, `))
    }
    else {
      ref = `${slot[1].trim()}.props`
      parentHead = head.replace(/^<[\w.]+/, s => `${s} data-rkp-done`)
    }
    childHead = childHead.replace(`...${name},`, `...${ref},`).replace(`v-bind="${name}"`, `v-bind="${ref}"`)
    parentHead = parentHead.replace(/^<[\w.]+/, s => `${s} __rkp`)
    code = code.slice(0, m.index) + parentHead + code.slice(end + 1, childStart) + childHead + code.slice(childEnd + 1)
    open.lastIndex = m.index + 1
  }
  return code.replaceAll(' __rkp ', ' ').replaceAll(' __rkp\n', '\n').replaceAll(' data-rkp-done', '')
}

function asChildSlotPropsPlugin() { // also applies PATCHES and swaps defineAsyncComponent
  return {
    name: 'reka-vapor-aschild-slot-props',
    buildEnd() {
      if (process.env.REKA_VAPOR_STATS)
        console.log(`[reka-vapor] ${stats.files} SFCs, ${stats.slotProps} Primitive slots given asChild props, ${stats.chains} asChild component chains rewritten`)
    },
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.vue') || !id.startsWith(resolve(core, 'src')))
        return null
      stats.files++
      // VDOM async wrappers can't render in a Vapor app without interop
      const out = asChildSlotProps(asChildComponentChains(applyPatches(code, id))).replace(/\bdefineAsyncComponent\b(?=[^\n]*from 'vue')/, 'defineVaporAsyncComponent as defineAsyncComponent')
      if (process.env.DUMP_SFC && id.includes(process.env.DUMP_SFC))
        console.log(out.slice(out.indexOf('<template>')))
      return out === code ? null : { code: out, map: null }
    },
  }
}

/** Injects `exposeElement()` at the start of every compiled Vapor SFC `setup` (see exposeElement.ts). */
function exposeElementPlugin() {
  const helper = resolve(here, 'src/shared/exposeElement.ts')
  return {
    name: 'reka-vapor-expose-element',
    enforce: 'post',
    transform(code, id) {
      if (!/\.vue\?vue&type=script/.test(id) || !/__vapor|defineVaporComponent/.test(code))
        return null
      const out = code
        .replace(/(setup\(__props[^)]*\)\s*\{)/, '$1\n__rekaExposeElement();')
        .replace(/\b__expose\(/g, '__rekaExposeWithElement(__expose, ')
      return out === code ? null : { code: `import { exposeElement as __rekaExposeElement, exposeWithElement as __rekaExposeWithElement } from ${JSON.stringify(helper)};\n${out}`, map: null }
    },
  }
}

export default {
  root: core,
  configFile: false,
  resolve: { alias: { '@': resolve(core, 'src') } },
  plugins: [
    overrides(),
    asChildSlotPropsPlugin(),
    vue({ compiler, features: { vapor: true } }),
    exposeElementPlugin(),
  ],
  define: { __REKA_UI_VERSION__: JSON.stringify('2.11.0-vapor-spike') },
  build: {
    outDir: resolve(core, 'dist-vapor'),
    emptyOutDir: true,
    minify: false,
    lib: { entry: resolve(here, 'src/index.ts'), formats: ['es'], fileName: () => 'index.js' },
    rollupOptions: {
      // reka's own VueUse imports are resolved to the shim first (rollup asks `external` before `resolveId`)
      external: (id, importer) => /^(?:vue|@vue\/|@vueuse\/|@floating-ui\/|@internationalized\/|@tanstack\/|aria-hidden|defu|ohash)/.test(id)
        && !(/^@vueuse\/(?:core|shared)$/.test(id) && importer?.startsWith(resolve(core, 'src'))),
    },
  },
}
