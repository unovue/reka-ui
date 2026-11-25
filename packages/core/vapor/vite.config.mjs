/* eslint-disable e18e/prefer-static-regex, no-cond-assign, node/prefer-global/process, regexp/no-contradiction-with-assertion -- spike build script */
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
    const inner = code.slice(end + 1, close).replace(/<slot\b(?![^>]*\bname=)/g, '<slot v-bind="__rkc"')
    return `${code.slice(0, end)} v-slot="__rkc"${code.slice(end, end + 1)}${inner}${code.slice(close)}`
  }
  return code
}

/**
 * Per-file template patches: the edits the real migration would make by hand.
 * - `asChild` onto a *component* (FocusScope → DismissableLayer → PopperContent) can't use DOM adoption:
 *   the attrs belong to the child component (PopperContent moves them past its wrapper div), so the
 *   chain hands them on explicitly with the scoped-slot `props`.
 * - A component whose root is `Presence` (a `<slot>` root in Vapor) gets no attrs fallthrough in Vapor,
 *   so it forwards `$attrs` explicitly. Both edits are VDOM-neutral.
 */
const PATCHES = {
  [src('Popover/PopoverContentImpl.vue')]: [
    ['<FocusScope\n    as-child', '<FocusScope\n    v-slot="{ props: focusScopeProps }"\n    as-child'],
    ['<DismissableLayer\n      as-child', '<DismissableLayer\n      v-slot="{ props: layerProps }"\n      v-bind="focusScopeProps"\n      as-child'],
    ['<PopperContent\n        v-bind="forwarded"', '<PopperContent\n        v-bind="{ ...layerProps, ...forwarded }"'],
  ],
  [src('Popover/PopoverContent.vue')]: [
    ['<script setup lang="ts">', '<script setup lang="ts">\ndefineOptions({ inheritAttrs: false })'],
    ['      v-bind="forwarded"', '      v-bind="{ ...forwarded, ...$attrs }"'],
  ],
}

function applyPatches(code, id) {
  for (const [from, to] of PATCHES[id] ?? []) {
    if (!code.includes(from))
      throw new Error(`[reka-vapor] patch for ${id} no longer applies: ${from}`)
    code = code.replace(from, to)
  }
  return code
}

function asChildSlotPropsPlugin() { // also applies PATCHES and swaps defineAsyncComponent
  return {
    name: 'reka-vapor-aschild-slot-props',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.vue') || !id.startsWith(resolve(core, 'src')))
        return null
      // VDOM async wrappers can't render in a Vapor app without interop
      const out = asChildSlotProps(applyPatches(code, id)).replace(/\bdefineAsyncComponent\b(?=[^\n]*from 'vue')/, 'defineVaporAsyncComponent as defineAsyncComponent')
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
      const out = code.replace(/(setup\(__props[^)]*\)\s*\{)/, '$1\n__rekaExposeElement();')
      return out === code ? null : { code: `import { exposeElement as __rekaExposeElement } from ${JSON.stringify(helper)};\n${out}`, map: null }
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
