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
//   3. rewrite imports (`defineAsyncComponent`, `getCurrentInstance`, a few VueUse helpers) and
//      templates (`asChild` slot props and component chains, Presence `$attrs`, `v-show` on components);
//   4. give every compiled SFC a default `$el` expose (`exposeElementPlugin`).
//
// Every transform counts what it rewrote, per file. The build compares the counts with
// `vapor/transform-expectations.json` and fails on any difference, so a `src/` change that a
// transform no longer understands cannot ship silently (see vapor/README.md).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'

const here = dirname(fileURLToPath(import.meta.url))
export const core = resolve(here, '..')
const require = createRequire(import.meta.url)
export const compiler = require('vue-vapor/compiler-sfc')
// Cross-file prop types (`extends PrimitiveProps`) need TypeScript
compiler.registerTS(() => require('typescript'))

/**
 * Path helpers for comparing module ids. Vite ids use forward slashes on every platform, while
 * `path.resolve()` returns backslashes on Windows, so both sides go through `toPosix` first. (Vite's
 * own `normalizePath` converts only on Windows; this one always does, so it is testable anywhere.)
 */
export const toPosix = p => p.replaceAll('\\', '/')
export function createPaths(srcDir) {
  const root = toPosix(srcDir).replace(/\/$/, '')
  const clean = id => toPosix(id.split('?')[0])
  return {
    root,
    /** Whether `id` (a Vite id or a file path, any separator) is a module under `srcDir`. */
    isSrc: id => clean(id).startsWith(`${root}/`),
    /** `id` relative to `srcDir`, with forward slashes. */
    rel: id => clean(id).slice(root.length + 1),
    /** The comparable form of a path under `srcDir`. */
    key: p => toPosix(resolve(srcDir, p)),
  }
}

const paths = createPaths(resolve(core, 'src'))
const isSrc = paths.isSrc
const src = paths.key
const rel = paths.rel
const INTERNALS = JSON.stringify(resolve(here, 'src/shared/internals.ts'))
const README = 'packages/core/vapor/README.md'

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
  [src('shared/useReferencedId.ts')]: resolve(here, 'src/shared/useReferencedId.ts'),
}
for (const [from, to] of Object.entries(MODULE_OVERRIDES)) {
  if (!existsSync(from))
    throw new Error(`[reka-vapor] MODULE_OVERRIDES in vapor/plugins.mjs: src/${rel(from)} no longer exists. Point the override at the module that replaced it, or remove it if the module is gone (see ${README}).`)
  if (!existsSync(to))
    throw new Error(`[reka-vapor] MODULE_OVERRIDES in vapor/plugins.mjs: the Vapor version ${relative(core, to)} of src/${rel(from)} is missing.`)
}

// ---------------------------------------------------------------------------------------------
// Transform counts

/** What each counter means, and where its transform lives, for the failure message. */
const TRANSFORMS = {
  sfcs: 'SFCs from src/ compiled in Vapor mode',
  patches: 'per-file patches applied (PATCHES)',
  slotProps: 'Primitive default slots given the asChild `props` (asChildSlotProps)',
  chains: 'asChild component chains rewritten (asChildComponentChains)',
  presenceAttrs: 'Presence children given `$attrs` (presenceRootAttrs)',
  vShow: '`v-show` on components turned into a display style (vShowOnComponents)',
  vShowWhenKept: '`v-show-when-kept` on components turned into a display style (vShowOnComponents)',
  asyncComponents: '`defineAsyncComponent` imports swapped for `defineVaporAsyncComponent` (rewriteImports)',
  getCurrentInstance: '`getCurrentInstance` imports swapped for the Vapor compat (rewriteImports)',
  vueuse: 'VueUse imports pointed at the Vapor shims (rewriteImports)',
  exposeElement: 'compiled SFCs given the default `$el` expose (exposeElementPlugin)',
  overrides: 'imports resolved to a Vapor module (MODULE_OVERRIDES)',
}

let stats = newStats()
function newStats() {
  return { totals: {}, overrides: {}, vueuse: {}, files: {} }
}
function count(id, key, n = 1) {
  if (!isSrc(id))
    return
  const file = rel(id)
  stats.totals[key] = (stats.totals[key] ?? 0) + n
  const entry = stats.files[file] ??= {}
  entry[key] = (entry[key] ?? 0) + n
}

const EXPECTATIONS = resolve(here, 'transform-expectations.json')

function sortKeys(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map(k => [k, obj[k] && typeof obj[k] === 'object' ? sortKeys(obj[k]) : obj[k]]))
}

function diffStats(expected, actual) {
  const lines = []
  const cmp = (label, e = {}, a = {}, describe = k => TRANSFORMS[k] ?? k) => {
    for (const key of new Set([...Object.keys(e), ...Object.keys(a)])) {
      if ((e[key] ?? 0) !== (a[key] ?? 0))
        lines.push(`  ${label}${describe(key)}: expected ${e[key] ?? 0}, got ${a[key] ?? 0}`)
    }
  }
  const files = new Set([...Object.keys(expected.files ?? {}), ...Object.keys(actual.files)])
  for (const file of [...files].sort())
    cmp(`src/${file}: `, expected.files?.[file], actual.files[file])
  cmp('MODULE_OVERRIDES ', expected.overrides, actual.overrides, k => `src/${k} (imports resolved to its Vapor version)`)
  cmp('VueUse shim ', expected.vueuse, actual.vueuse, k => `\`${k}\``)
  cmp('total ', expected.totals, actual.totals)
  return lines
}

/**
 * Build only: fails when the counts differ from `transform-expectations.json`. `vite build -c
 * vapor/vite.config.mjs --mode update-expectations` (`pnpm vapor:expectations`) rewrites the file.
 */
export function transformExpectations() {
  let update = false
  return {
    name: 'reka-vapor-transform-expectations',
    apply: 'build',
    configResolved(config) {
      update = config.mode === 'update-expectations'
    },
    buildStart() {
      stats = newStats()
    },
    buildEnd(error) {
      if (error)
        return
      const actual = sortKeys(stats)
      if (update) {
        writeFileSync(EXPECTATIONS, `${JSON.stringify(actual, null, 2)}\n`)
        console.log(`[reka-vapor] wrote ${relative(core, EXPECTATIONS)}`)
        return
      }
      const expected = existsSync(EXPECTATIONS) ? JSON.parse(readFileSync(EXPECTATIONS, 'utf8')) : {}
      const lines = diffStats(expected, actual)
      if (lines.length) {
        this.error([
          `[reka-vapor] The Vapor build transforms (packages/core/vapor/plugins.mjs) rewrote src/ differently than vapor/transform-expectations.json records:`,
          ...lines.slice(0, 40),
          ...(lines.length > 40 ? [`  … and ${lines.length - 40} more`] : []),
          '',
          'If the src/ change explains the difference (a template gained an asChild Primitive, a family was added to the Vapor entry, …),',
          'update the file with `pnpm --filter reka-ui vapor:expectations` and commit it. If a count dropped although the src/ code still',
          `needs the rewrite, the transform no longer recognises it: fix it in vapor/plugins.mjs. See ${README}.`,
        ].join('\n'))
      }
    },
  }
}

// ---------------------------------------------------------------------------------------------
// Module overrides

/** The Vapor module that replaces `id` (a Vite id, any separator), if any. */
export function overrideFor(id) {
  return MODULE_OVERRIDES[toPosix(id.split('?')[0])]
}

function overrides() {
  return {
    name: 'reka-vapor-overrides',
    enforce: 'pre',
    async resolveId(id, importer, opts) {
      if (!importer || id.includes('?'))
        return null
      const r = await this.resolve(id, importer, { ...opts, skipSelf: true })
      const target = r && overrideFor(r.id)
      if (!target)
        return null
      const key = rel(r.id)
      stats.overrides[key] = (stats.overrides[key] ?? 0) + 1
      return target
    },
  }
}

// ---------------------------------------------------------------------------------------------
// Import rewrites (AST)

// VueUse helpers that decide "inside a component?" with `getCurrentInstance()` (null in Vapor). reka's
// own imports of them are pointed at Vapor-safe versions (`vapor/src/shared/vueuse.ts`); every other
// VueUse import stays as it is, so bundlers still tree-shake VueUse.
const VUEUSE_SHIMMED = new Set(['useMounted', 'tryOnMounted', 'tryOnBeforeUnmount', 'tryOnUnmounted', 'useParentElement'])
const VUEUSE_SHIM = JSON.stringify(resolve(here, 'src/shared/vueuse.ts'))

/** Script blocks of an SFC (or the whole module for `.ts`) as `{ offset, content }`. */
function scriptBlocks(code, id) {
  if (!id.endsWith('.vue'))
    return [{ offset: 0, content: code }]
  const { descriptor, errors } = compiler.parse(code, { filename: id })
  if (errors.length)
    throw new Error(`[reka-vapor] ${id}: ${errors[0].message}`)
  return [descriptor.script, descriptor.scriptSetup].filter(Boolean).map(b => ({ offset: b.loc.start.offset, content: b.content }))
}

/** Applies `[start, end, text]` edits (absolute offsets, non-overlapping). */
function applyEdits(code, edits) {
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + text + code.slice(end)
  return code
}

/**
 * Parses each script's imports (Babel AST, so formatting doesn't matter) and rewrites:
 *   - `defineAsyncComponent` from 'vue' → `defineVaporAsyncComponent` (a VDOM async wrapper can't render
 *     in a Vapor app without interop);
 *   - `getCurrentInstance` from 'vue' → the Vapor-aware `getCurrentInstanceCompat` (internals.ts);
 *   - the shimmed VueUse helpers → `vapor/src/shared/vueuse.ts`.
 */
function rewriteImports(code, id) {
  if (!/\b(?:defineAsyncComponent|getCurrentInstance)\b|@vueuse\//.test(code))
    return code
  const edits = []
  for (const block of scriptBlocks(code, id)) {
    const ast = compiler.babelParse(block.content, { sourceType: 'module', plugins: ['typescript'] })
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration' || node.importKind === 'type')
        continue
      const from = node.source.value
      const isVue = from === 'vue'
      const isVueUse = from === '@vueuse/core' || from === '@vueuse/shared'
      if (!isVue && !isVueUse)
        continue
      const keep = []
      const added = []
      let changed = false
      for (const s of node.specifiers) {
        const text = block.content.slice(s.start, s.end)
        if (s.type !== 'ImportSpecifier' || s.importKind === 'type') {
          keep.push({ s, text })
          continue
        }
        const name = s.imported.name ?? s.imported.value
        const local = s.local.name
        if (isVue && name === 'defineAsyncComponent') {
          keep.push({ s, text: `defineVaporAsyncComponent as ${local}` })
          count(id, 'asyncComponents')
          changed = true
        }
        else if (isVue && name === 'getCurrentInstance') {
          added.push(`import { getCurrentInstanceCompat as ${local} } from ${INTERNALS}`)
          count(id, 'getCurrentInstance')
          changed = true
        }
        else if (isVueUse && VUEUSE_SHIMMED.has(name)) {
          added.push(`import { ${name} as ${local} } from ${VUEUSE_SHIM}`)
          count(id, 'vueuse')
          if (isSrc(id))
            stats.vueuse[name] = (stats.vueuse[name] ?? 0) + 1
          changed = true
        }
        else {
          keep.push({ s, text })
        }
      }
      if (!changed)
        continue
      const named = keep.filter(k => k.s.type === 'ImportSpecifier').map(k => k.text)
      const other = keep.filter(k => k.s.type !== 'ImportSpecifier').map(k => k.text)
      const head = [...other, ...(named.length ? [`{ ${named.join(', ')} }`] : [])]
      const decl = head.length ? `import ${head.join(', ')} from ${JSON.stringify(from)}` : ''
      edits.push([block.offset + node.start, block.offset + node.end, [decl, ...added].filter(Boolean).join('\n')])
    }
  }
  return edits.length ? applyEdits(code, edits) : code
}

// ---------------------------------------------------------------------------------------------
// Template rewrites

/** The compiler's template AST, whose offsets are absolute in `code`. */
function templateAst(code, id) {
  const { descriptor, errors } = compiler.parse(code, { filename: id })
  if (errors.length)
    throw new Error(`[reka-vapor] ${id}: ${errors[0].message}`)
  return descriptor
}

function walkElements(node, fn) {
  for (const child of node.children ?? []) {
    if (child.type === 1) {
      fn(child)
      walkElements(child, fn)
    }
    else if (child.branches) {
      for (const b of child.branches) walkElements(b, fn)
    }
  }
}

const ELEMENT = 1
const DIRECTIVE = 7
const COMPONENT = 1

/** The quote an attribute value is written in, and the other one for string literals inside it. */
function quotes(code, attr) {
  const q = code[attr.exp.loc.start.offset - 1]
  if (q !== '"' && q !== '\'')
    throw new Error(`unquoted attribute value \`${attr.loc.source}\``)
  return { q, inner: q === '"' ? '\'' : '"' }
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
function asChildSlotProps(code, id) {
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
    count(id, 'slotProps')
    const inner = code.slice(end + 1, close).replace(/<slot\b(?![^>]*\b(?:name=|v-bind=))/g, '<slot v-bind="__rkc"')
    return `${code.slice(0, end)} v-slot="__rkc"${code.slice(end, end + 1)}${inner}${code.slice(close)}`
  }
  return code
}

/** Per-file patches: the edits the real migration would make by hand. */
const PATCHES = {
  // Contexts get their referenced-id getters when provided, before any part reads them (see
  // vapor/src/shared/useReferencedId.ts: Vapor cannot re-render the parts that read them earlier).
  [src('shared/createContext.ts')]: [
    ['import { inject, provide } from \'vue\'', `import { inject, provide } from 'vue'\nimport { prepareReferencedIds } from ${JSON.stringify(resolve(here, 'src/shared/useReferencedId.ts'))}`],
    ['provide(injectionKey, contextValue)', 'provide(injectionKey, prepareReferencedIds(contextValue))'],
  ],
  // `vShowOnComponents` turns ComboboxContent's `v-show` into a `display: none` style that reaches this
  // component through `$attrs`, and the `:style` below (bound after `v-bind="$attrs"`) sets `display: flex`
  // over it. VDOM's `v-show` writes `el.style.display` after props, so it wins there. Fold the same
  // condition (`present`, which ComboboxContent passes with the `v-show` value) into the display.
  [src('Combobox/ComboboxContentImpl.vue')]: [
    ['display: (props.hideWhenEmpty && isEmpty) ? \'none\' : \'flex\',', 'display: (!props.present || (props.hideWhenEmpty && isEmpty)) ? \'none\' : \'flex\','],
  ],
  // A consumer listener on the trigger (`@click`, `@keydown`, `@pointerdown`) has to run before the
  // trigger's own, which skip opening when it called `preventDefault()`. In VDOM the attrs fall through
  // `MenuAnchor` (and `RovingFocusItem`) `asChild`, whose `Slot` merges them before the child's own
  // listeners. Vapor's `asChild` adoption adds them to the element after the child's own. Bind the attrs
  // on the trigger's `Primitive` before its own listeners instead, so the merged handler calls the
  // consumer's first, as v2 does.
  [src('DropdownMenu/DropdownMenuTrigger.vue')]: [
    ['const { forwardRef, currentElement: triggerElement } = useForwardExpose()', 'defineOptions({ inheritAttrs: false })\nconst { forwardRef, currentElement: triggerElement } = useForwardExpose()'],
    ['<MenuAnchor as-child>\n    <Primitive\n', '<MenuAnchor as-child>\n    <Primitive\n      v-bind="$attrs"\n'],
  ],
  [src('Menubar/MenubarTrigger.vue')]: [
    ['const { forwardRef, currentElement: triggerElement } = useForwardExpose()', 'defineOptions({ inheritAttrs: false })\nconst { forwardRef, currentElement: triggerElement } = useForwardExpose()'],
    ['<MenuAnchor as-child>\n        <Primitive\n', '<MenuAnchor as-child>\n        <Primitive\n          v-bind="$attrs"\n'],
  ],
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
  const descriptor = templateAst(code, id)
  const roots = (descriptor.template?.ast.children ?? []).filter(n => n.type === ELEMENT)
  if (roots.length !== 1 || roots[0].tag !== 'Presence')
    return code
  const edits = []
  if (!descriptor.template.content.includes('$attrs')) {
    const child = roots[0].children.find(n => n.type === ELEMENT)
    if (!child)
      throw new Error(`[reka-vapor] presenceRootAttrs (vapor/plugins.mjs): ${id} is rooted in <Presence> but has no child element to forward $attrs to. Forward them by hand in the template (v-bind="$attrs").`)
    const bind = child.props.find(p => p.type === DIRECTIVE && p.name === 'bind' && !p.arg)
    if (bind) {
      // One object `v-bind` per tag: merge into it. Bindings written after it now win over `$attrs`
      const { q } = quotes(code, bind)
      edits.push([bind.loc.start.offset, bind.loc.end.offset, `v-bind=${q}{ ...(${bind.exp.loc.source}), ...$attrs }${q}`])
    }
    else {
      let end = tagEnd(code, child.loc.start.offset)
      if (code[end - 1] === '/')
        end--
      edits.push([end, end, ' v-bind="$attrs"'])
    }
    count(id, 'presenceAttrs')
  }
  const setup = descriptor.scriptSetup
  if (!setup)
    throw new Error(`[reka-vapor] presenceRootAttrs (vapor/plugins.mjs): ${id} has no <script setup> to declare inheritAttrs: false in.`)
  const ast = compiler.babelParse(setup.content, { sourceType: 'module', plugins: ['typescript'] })
  const call = ast.program.body.find(n => n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.name === 'defineOptions')?.expression
  if (call) {
    const options = call.arguments[0]
    if (options?.type !== 'ObjectExpression')
      throw new Error(`[reka-vapor] presenceRootAttrs (vapor/plugins.mjs): ${id} calls defineOptions without an object literal; add inheritAttrs: false by hand.`)
    if (!options.properties.some(p => (p.key?.name ?? p.key?.value) === 'inheritAttrs'))
      edits.push([setup.loc.start.offset + options.start + 1, setup.loc.start.offset + options.start + 1, ' inheritAttrs: false,'])
  }
  else {
    edits.push([setup.loc.start.offset, setup.loc.start.offset, '\ndefineOptions({ inheritAttrs: false })'])
  }
  return applyEdits(code, edits)
}

/**
 * `v-show` (and v2's VDOM-only `v-show-when-kept` directive) on a *component* lands on its root element
 * in VDOM. In Vapor a directive can't pass an `asChild` slot root, so the display goes on as a style,
 * which reaches the element like any fallthrough attribute. Matched on the template AST, so quoting and
 * attribute order don't matter.
 */
function vShowOnComponents(code, id) {
  if (!/\sv-show/.test(code))
    return code
  const descriptor = templateAst(code, id)
  if (!descriptor.template)
    return code
  const edits = []
  walkElements(descriptor.template.ast, (el) => {
    if (el.tagType !== COMPONENT)
      return
    for (const p of el.props) {
      if (p.type !== DIRECTIVE || (p.name !== 'show' && p.name !== 'show-when-kept'))
        continue
      const fail = why => new Error(`[reka-vapor] vShowOnComponents (vapor/plugins.mjs): ${id}, <${el.tag} ${p.loc.source}>: ${why}`)
      if (!p.exp)
        throw fail('no expression')
      if (el.props.some(o => o.type === DIRECTIVE && o.name === 'bind' && o.arg?.content === 'style'))
        throw fail('the component also binds :style; merge the display into that binding by hand')
      let q, inner
      try {
        ({ q, inner } = quotes(code, p))
      }
      catch (e) {
        throw fail(e.message)
      }
      const none = `{ display: ${inner}none${inner} }`
      const value = p.exp.loc.source
      if (p.name === 'show') {
        edits.push([p.loc.start.offset, p.loc.end.offset, `:style=${q}(${value}) ? undefined : ${none}${q}`])
        count(id, 'vShow')
      }
      else {
        if (!p.arg || p.arg.isStatic)
          throw fail('expected a dynamic argument (v-show-when-kept:[forceMount])')
        edits.push([p.loc.start.offset, p.loc.end.offset, `:style=${q}${p.arg.content} === ${inner}kept${inner} && !(${value}) ? ${none} : undefined${q}`])
        count(id, 'vShowWhenKept')
      }
    }
  })
  return edits.length ? applyEdits(code, edits) : code
}

function applyPatches(code, id) {
  for (const [from, to] of PATCHES[id] ?? []) {
    if (from instanceof RegExp ? !from.test(code) : !code.includes(from))
      throw new Error(`[reka-vapor] PATCHES (vapor/plugins.mjs): the patch for ${id} no longer applies, ${from} is not in the file. Update the patch to the new source.`)
    code = code.replace(from, to)
    count(id, 'patches')
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
function asChildComponentChains(code, id) {
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
    count(id, 'chains')
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

/** Rewrites reka's own `src/` modules: patches, imports, then templates. */
function srcTransformsPlugin() {
  return {
    name: 'reka-vapor-src-transforms',
    enforce: 'pre',
    transform(code, id) {
      if (!isSrc(id) || id.includes('?') || !/\.(?:vue|ts)$/.test(id))
        return null
      let out = applyPatches(rewriteImports(code, id), id)
      if (id.endsWith('.vue')) {
        count(id, 'sfcs')
        out = presenceRootAttrs(out, id)
        out = vShowOnComponents(out, id)
        out = asChildComponentChains(out, id)
        out = asChildSlotProps(out, id)
      }
      if (process.env.DUMP_SFC && id.includes(process.env.DUMP_SFC))
        console.log(out)
      return out === code ? null : { code: out, map: null }
    },
  }
}

const SETUP = /(setup\(__props[^)]*\)\s*\{)/

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
      if (!SETUP.test(code)) {
        if (isSrc(id))
          throw new Error(`[reka-vapor] exposeElementPlugin (vapor/plugins.mjs): no \`setup(__props…) {\` in the Vapor output of ${rel(id)}, so it would lose its default \`$el\` expose. The compiler output changed: update SETUP in vapor/plugins.mjs.`)
        return null
      }
      count(id, 'exposeElement')
      const out = code
        .replace(SETUP, '$1\n__rekaExposeElement();')
        .replace(/\b__expose\(/g, '__rekaExposeWithElement(__expose, ')
      return { code: `import { exposeElement as __rekaExposeElement, exposeWithElement as __rekaExposeWithElement } from ${JSON.stringify(helper)};\n${out}`, map: null }
    },
  }
}

/** The plugin chain that compiles `src/` into the Vapor build (also used by the Vapor tests). */
export function rekaVaporPlugins() {
  return [
    overrides(),
    srcTransformsPlugin(),
    vue({ compiler, features: { vapor: true } }),
    exposeElementPlugin(),
  ]
}

/** Dependencies left to the consumer's bundler, as in the main build. */
export const EXTERNAL = /^(?:vue|@vue\/|@vueuse\/|@floating-ui\/|@internationalized\/|@tanstack\/|aria-hidden|defu|ohash)/

export function isExternal(id) {
  return EXTERNAL.test(id)
}
