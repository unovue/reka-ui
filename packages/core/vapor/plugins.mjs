/* eslint-disable e18e/prefer-static-regex, no-cond-assign, no-console, node/prefer-global/process, regexp/no-contradiction-with-assertion -- build-time template rewriting */
// Vite plugins that compile reka-ui's `src/` a second time, in Vapor mode, for `reka-ui/vapor`.
// Shared by the build (`vapor/vite.config.mjs`) and the Vapor browser tests (`vitest.vapor.config.ts`).
//
// The repo pins Vue 3.5 (no Vapor compiler), so the Vapor compiler comes from the `vue-vapor`
// devDependency (`npm:vue@3.6.0-rc.16`), passed to `@vitejs/plugin-vue` explicitly.
//
// What the plugins do:
//   1. compile the *unchanged* v2 SFCs from `src/` with `features.vapor` (same source, second output);
//   2. swap the VDOM-only modules for Vapor versions (MODULE_OVERRIDES);
//   3. rewrite `asChild` templates so slot props reach the consumer (`asChildSlotProps`,
//      `asChildComponentChains`), a build-time stand-in for editing ~260 templates by hand;
//   4. give every compiled SFC a default `$el` expose (`exposeElementPlugin`).
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'

const here = dirname(fileURLToPath(import.meta.url))
export const core = resolve(here, '..')
const require = createRequire(import.meta.url)
export const compiler = require('vue-vapor/compiler-sfc')
// Cross-file prop types (`extends PrimitiveProps`) need TypeScript
compiler.registerTS(() => require('typescript'))

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
  [src('shared/useForwardRef.ts')]: resolve(here, 'src/shared/useForwardRef.ts'),
}

function overrides() {
  return {
    name: 'reka-vapor-overrides',
    enforce: 'pre',
    async resolveId(id, importer, opts) {
      if (!importer || id.includes('?'))
        return null
      const r = await this.resolve(id, importer, { ...opts, skipSelf: true })
      return r && MODULE_OVERRIDES[r.id] ? MODULE_OVERRIDES[r.id] : null
    },
  }
}

const stats = { files: 0, chains: 0, slotProps: 0, presenceAttrs: 0 }

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

/** Per-file template patches: the edits the real migration would make by hand. */
const PATCHES = {
  [src('ScrollArea/ScrollAreaVirtualizer.vue')]: [
    [/\/\/ not a computed: slots aren't reactive[^\n]*\nfunction getVirtualizedItems\(\) \{[\s\S]*?\n\}\n/, `function rowAttrs(item: VirtualItem) {
  const start = item.start - scrollMargin.value
  return {
    'data-index': item.index,
    'style': {
      position: props.horizontal ? 'relative' : 'absolute',
      gridArea: props.horizontal ? '1 / 1' : undefined,
      justifySelf: props.horizontal ? 'start' : undefined,
      top: 0,
      ...(props.horizontal ? { [isRtl.value ? 'right' : 'left']: 0 } : { left: 0, right: 0 }),
      transform: props.horizontal ? \`translateX(\${isRtl.value ? -start : start}px)\` : \`translateY(\${start}px)\`,
      overflowAnchor: 'none',
    },
  }
}
`],
    ['import { injectScrollAreaRootContext } from \'./ScrollAreaRoot.vue\'', 'import { injectScrollAreaRootContext } from \'./ScrollAreaRoot.vue\'\nimport { Primitive } from \'@/Primitive\''],
    [/<component\s+:is="is"\s+v-for="\{ is, item \} in getVirtualizedItems\(\)"\s+:key="item.key"\s*\/>/, `<Primitive v-for="item in virtualizer.getVirtualItems()" :key="item.key" as-child v-bind="rowAttrs(item)">
      <slot :option="props.options[item.index]" :virtualizer="virtualizer" :virtual-item="item" />
    </Primitive>`],
  ],
  // Same as the Listbox virtualizer: one `asChild` Primitive per row instead of cloning the slot VNode
  [src('Tree/TreeVirtualizer.vue')]: [
    [/const virtualizedItems = computed\(\(\) => virtualizer\.value\.getVirtualItems\(\)\.map\(\(item\) => \{[\s\S]*?\n\}\)\)\n/, `const virtualItems = computed(() => virtualizer.value.getVirtualItems())
function rowAttrs(item: VirtualItem) {
  return {
    'data-index': item.index,
    'style': { position: 'absolute', top: 0, left: 0, transform: \`translateY(\${item.start}px)\`, overflowAnchor: 'none' },
  }
}
`],
    ['import { useCollection } from \'@/Collection\'', 'import { useCollection } from \'@/Collection\'\nimport { Primitive } from \'@/Primitive\''],
    [/<component\s+:is="is"\s+v-for="\{ is, item \} in virtualizedItems"\s+:key="item.key"\s*\/>/, `<Primitive v-for="item in virtualItems" :key="item.key" as-child v-bind="rowAttrs(item)">
      <slot :item="rootContext.expandedItems.value[item.index]" :virtualizer="virtualizer" :virtual-item="item" />
    </Primitive>`],
  ],
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
}

/**
 * A component rooted in `<Presence>` relies on VDOM fallthrough reaching Presence's slotted child. Vapor
 * doesn't resolve fallthrough through a slot outlet (dev warns "Extraneous non-props attributes"), so
 * the component forwards `$attrs` to that child itself, last, so they still win as fallthrough does:
 *   <Presence …><Primitive :id="x" …>  →  inheritAttrs: false + <Presence …><Primitive :id="x" … v-bind="$attrs">
 * A child with its own object `v-bind` gets `$attrs` merged into it. Components that already bind
 * `$attrs` keep their own placement.
 */
function presenceRootAttrs(code, id) {
  const tpl = code.indexOf('<template>')
  const root = /^\s*<(\w+)/.exec(code.slice(tpl + '<template>'.length))
  if (tpl < 0 || root?.[1] !== 'Presence')
    return code
  const template = code.slice(tpl)
  if (!template.includes('$attrs')) {
    const presenceEnd = tagEnd(code, code.indexOf('<Presence', tpl))
    const child = /<[A-Z][\w.]*\b/gi
    child.lastIndex = presenceEnd
    const m = child.exec(code)
    if (!m)
      throw new Error(`[reka-vapor] ${id}: no child under <Presence>`)
    let end = tagEnd(code, m.index)
    const head = code.slice(m.index, end + 1)
    const bind = /\sv-bind="([^"]*)"/.exec(head)
    if (bind) {
      // One object `v-bind` per tag: merge into it. Bindings written after it now win over `$attrs`
      code = code.slice(0, m.index) + head.replace(bind[0], ` v-bind="{ ...(${bind[1]}), ...$attrs }"`) + code.slice(end + 1)
    }
    else {
      if (code[end - 1] === '/')
        end--
      code = `${code.slice(0, end)} v-bind="$attrs"${code.slice(end)}`
    }
    stats.presenceAttrs++
  }
  if (/defineOptions\(\{[^}]*inheritAttrs:\s*false/.test(code))
    return code
  if (code.includes('defineOptions({'))
    return code.replace('defineOptions({', 'defineOptions({ inheritAttrs: false,')
  return code.replace(/<script setup[^>]*>/, s => `${s}\ndefineOptions({ inheritAttrs: false })`)
}

/**
 * `v-show` (and v2's VDOM-only `v-show-when-kept` directive) on a *component* lands on its root element
 * in VDOM. In Vapor a directive can't pass an `asChild` slot root, so the display goes on as a style,
 * which reaches the element like any fallthrough attribute.
 */
function vShowOnComponents(code) {
  const tpl = code.indexOf('<template>')
  if (tpl < 0)
    return code
  return code.slice(0, tpl) + code.slice(tpl)
    .replace(/(<(?:[A-Z][\w.]*|component)\b[^>]*?)\sv-show="([^"]*)"/g, (_, head, value) => `${head} :style="(${value}) ? undefined : { display: 'none' }"`)
    .replace(/(<(?:[A-Z][\w.]*|component)\b[^>]*?)\sv-show-when-kept:\[(\w+)\]="([^"]*)"/g, (_, head, arg, value) => `${head} :style="${arg} === 'kept' && !(${value}) ? { display: 'none' } : undefined"`)
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

// `getCurrentInstance()` is `null` in Vapor; the few v2 SFCs that call it get a Vapor-aware stand-in
const GET_CURRENT_INSTANCE_IMPORT = /import \{([^}]*?)\bgetCurrentInstance,?([^}]*)\} from 'vue'/

function asChildSlotPropsPlugin() { // also applies PATCHES and swaps defineAsyncComponent
  return {
    name: 'reka-vapor-aschild-slot-props',
    buildEnd() {
      if (process.env.REKA_VAPOR_STATS)
        console.log(`[reka-vapor] ${stats.files} SFCs, ${stats.slotProps} Primitive slots given asChild props, ${stats.chains} asChild component chains rewritten, ${stats.presenceAttrs} Presence children given $attrs`)
    },
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.vue') || !id.startsWith(resolve(core, 'src')))
        return null
      stats.files++
      // VDOM async wrappers can't render in a Vapor app without interop
      const out = asChildSlotProps(asChildComponentChains(vShowOnComponents(presenceRootAttrs(applyPatches(code, id), id)))).replace(/\bdefineAsyncComponent\b(?=[^\n]*from 'vue')/, 'defineVaporAsyncComponent as defineAsyncComponent').replace(GET_CURRENT_INSTANCE_IMPORT, (_, before, after) => `import {${before}${after}} from 'vue'\nimport { getCurrentInstanceCompat as getCurrentInstance } from ${JSON.stringify(resolve(here, 'src/shared/internals.ts'))}`)
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
      // `?vue&type=script` sub-module in a build, the `.vue` module itself under the dev server
      if (!/\.vue(?:\?vue&type=script|$)/.test(id) || !/__vapor|defineVaporComponent/.test(code))
        return null
      const out = code
        .replace(/(setup\(__props[^)]*\)\s*\{)/, '$1\n__rekaExposeElement();')
        .replace(/\b__expose\(/g, '__rekaExposeWithElement(__expose, ')
      return out === code ? null : { code: `import { exposeElement as __rekaExposeElement, exposeWithElement as __rekaExposeWithElement } from ${JSON.stringify(helper)};\n${out}`, map: null }
    },
  }
}

// VueUse helpers that decide "inside a component?" with `getCurrentInstance()` (null in Vapor). reka's
// own imports of them are pointed at Vapor-safe versions (`vapor/src/shared/vueuse.ts`); every other
// VueUse import stays as it is, so bundlers still tree-shake VueUse.
const VUEUSE_SHIMMED = new Set(['useMounted', 'tryOnMounted', 'tryOnBeforeUnmount', 'tryOnUnmounted', 'useParentElement'])
const VUEUSE_IMPORT = /import\s*\{([^}]*)\}\s*from\s*'@vueuse\/(?:core|shared)'/g

function vueuseImports() {
  const shim = JSON.stringify(resolve(here, 'src/shared/vueuse.ts'))
  return {
    name: 'reka-vapor-vueuse-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!id.startsWith(resolve(core, 'src')) || !/\.(?:vue|ts)$/.test(id) || !code.includes('@vueuse/'))
        return null
      const out = code.replace(VUEUSE_IMPORT, (all, list) => {
        const names = list.split(',').map(n => n.trim()).filter(Boolean)
        const shimmed = names.filter(n => VUEUSE_SHIMMED.has(n.replace(/^type\s+/, '').split(/\s+as\s+/)[0]))
        if (!shimmed.length)
          return all
        const rest = names.filter(n => !shimmed.includes(n))
        return `${rest.length ? all.replace(list, ` ${rest.join(', ')} `) : ''}\nimport { ${shimmed.join(', ')} } from ${shim}`
      })
      return out === code ? null : { code: out, map: null }
    },
  }
}

/** The plugin chain that compiles `src/` into the Vapor build (also used by the Vapor tests). */
export function rekaVaporPlugins() {
  return [
    overrides(),
    vueuseImports(),
    asChildSlotPropsPlugin(),
    vue({ compiler, features: { vapor: true } }),
    exposeElementPlugin(),
  ]
}

/** Dependencies left to the consumer's bundler, as in the main build. */
export const EXTERNAL = /^(?:vue|@vue\/|@vueuse\/|@floating-ui\/|@internationalized\/|@tanstack\/|aria-hidden|defu|ohash)/

export function isExternal(id) {
  return EXTERNAL.test(id)
}
