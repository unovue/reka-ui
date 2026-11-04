import type { PartMeta, PropMeta, RekaElementFamily, RekaElementPartDefinition } from '../src/elements/meta'
import type { ToastProviderElementEmits } from '../src/elements/toast'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * The Custom Elements Manifest (https://github.com/webcomponents/custom-elements-manifest)
 * of `reka-ui/elements`, written to `dist/custom-elements.json` by the build.
 *
 * The elements are not classes in the source: `defineRekaElements()` creates one per
 * part at runtime, from the family registry (`families.ts`) and the props and emits
 * the part's Vue component declares (`getPartMeta()`). A static analyzer finds none of
 * them, so the manifest is built from that same registry, loaded from the built
 * entry: the tags, attributes, properties and events are what the runtime defines.
 * Types, descriptions and defaults come from the docs' generated component meta
 * (`docs/content/meta`, from `vue-component-meta`) and part descriptions from the
 * component pages, where they exist.
 */

export const MANIFEST_FILE = 'custom-elements.json'
/** The module the elements come from: the `reka-ui/elements` entry. */
export const ELEMENTS_MODULE = 'dist/elements.js'
const SCHEMA_VERSION = '2.1.0'
const PREFIX = 'reka'

interface PropDoc {
  type?: string
  description?: string
  default?: string
  required?: boolean
}

interface EventDoc {
  type?: string
  description?: string
}

export interface PartDoc {
  description?: string
  props: Map<string, PropDoc>
  events: Map<string, EventDoc>
}

export interface ElementsManifestSource {
  families: readonly RekaElementFamily[]
  getPartMeta: (definition: RekaElementPartDefinition) => PartMeta
  toPartDefinition: (part: RekaElementFamily['parts'][string]) => RekaElementPartDefinition
  hyphenate: (name: string) => string
  toEventType: (emit: string) => string
  /** Docs of each part, by part name (`DialogRoot`). */
  docs?: Map<string, PartDoc>
}

interface Type {
  text: string
}

interface Reference {
  name: string
  module?: string
}

export interface ManifestAttribute {
  name: string
  type?: Type
  description?: string
  default?: string
  fieldName?: string
}

export interface ManifestField {
  kind: 'field'
  name: string
  type?: Type
  description?: string
  default?: string
  attribute?: string
  reflects?: boolean
  readonly?: boolean
  inheritedFrom?: Reference
}

export interface ManifestEvent {
  name: string
  type?: Type
  description?: string
  inheritedFrom?: Reference
}

export interface ManifestSlot {
  name: string
  description?: string
}

export interface ManifestElement {
  kind: 'class'
  name: string
  description?: string
  customElement: true
  tagName: string
  superclass: Reference
  attributes: ManifestAttribute[]
  members: ManifestField[]
  events: ManifestEvent[]
  slots: ManifestSlot[]
}

export interface ElementsManifest {
  schemaVersion: string
  modules: {
    kind: 'javascript-module'
    path: string
    declarations: (ManifestElement | { kind: 'class', name: string, description: string, members: ManifestField[], events: ManifestEvent[] })[]
    exports: (
      | { kind: 'js', name: string, declaration: Reference }
      | { kind: 'custom-element-definition', name: string, declaration: Reference }
    )[]
  }[]
}

const BASE: Reference = { name: 'RekaElement', module: ELEMENTS_MODULE }

const SLOT_PROPS: ManifestField = {
  kind: 'field',
  name: 'slotProps',
  type: { text: 'Readonly<Record<string, unknown>> | undefined' },
  readonly: true,
  description: 'The props the part passes to its default slot, like a Vue scoped slot\'s, or `undefined` while the part is not rendered. A `slot-props-change` event follows each new set.',
}

const SLOT_PROPS_CHANGE: ManifestEvent = {
  name: 'slot-props-change',
  type: { text: 'RekaElementEvent<Readonly<Record<string, unknown>>>' },
  description: 'Dispatched after the part renders with new slot props (`event.detail.value`, also in `slotProps`).',
}

const FORM: ManifestField = {
  kind: 'field',
  name: 'form',
  type: { text: 'HTMLFormElement | null' },
  readonly: true,
  description: 'The form the element is associated with, like a native control\'s.',
}

/** Emits only the element adds to a part (they are not in the component's docs). */
const ELEMENT_EVENT_DOCS: Record<string, Record<string, EventDoc>> = {
  ToastProvider: {
    'update:toasts': {
      type: '[toasts: ToastObject[]]',
      description: 'The provider\'s toasts changed (newest first): render a `<reka-toast-root>` for each, with its `toast` property set.',
    },
  } satisfies Record<keyof ToastProviderElementEmits, EventDoc>,
}

/** The value an attribute of each kind takes, when it is not the prop's own type. */
const ATTRIBUTE_FORMATS: Partial<Record<PropMeta['kind'], string>> = {
  'numbers': 'Numbers separated by spaces or commas (`"20 80"`).',
  'date': 'An ISO 8601 date or date-time (`2026-10-14`, `2026-10-14T09:30`, or with a `[time zone]`), parsed into a Temporal value.',
  'time': 'An ISO 8601 time, date-time or zoned date-time (`09:30`), parsed into a Temporal value.',
  'date-range': 'Two ISO 8601 dates separated by `/` (`2026-10-05/2026-10-07`), parsed into `{ start, end }`.',
  'time-range': 'Two ISO 8601 times separated by `/` (`09:00/17:00`), parsed into `{ start, end }`.',
}

/** Splits a type on its top-level `separator`s (`|` in a union, `,` in a tuple). */
function splitTopLevel(type: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < type.length; i++) {
    const char = type[i]
    if (quote) {
      if (char === quote && type[i - 1] !== '\\')
        quote = ''
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
    }
    else if (char === '=' && type[i + 1] === '>') {
      i++
    }
    else if ('([{<'.includes(char)) {
      depth++
    }
    else if (')]}>'.includes(char)) {
      depth--
    }
    else if (char === separator && depth === 0) {
      parts.push(type.slice(start, i))
      start = i + 1
    }
  }
  parts.push(type.slice(start))
  return parts.map(part => part.trim()).filter(Boolean)
}

const STRING_LITERAL = /^(['"]).*\1$/

/** A `string` prop's type as its attribute's: kept when it is a union of strings (`'horizontal' | 'vertical'`). */
function stringAttributeType(type: string | undefined): string {
  const members = splitTopLevel(type ?? '', '|').filter(member => member !== 'null' && member !== 'undefined')
  return members.length && members.every(member => member === 'string' || STRING_LITERAL.test(member))
    ? members.join(' | ')
    : 'string'
}

const BOOLEANISH_MEMBER = /^(?:boolean|true|false|(['"]).*\1)$/

/** A `booleanish` prop's type as its attribute's (`boolean | 'indeterminate'`), unless it is generic (`T`). */
function booleanishAttributeType(type: string | undefined): string {
  const members = splitTopLevel(type ?? '', '|').filter(member => member !== 'null' && member !== 'undefined')
  return members.length && members.every(member => BOOLEANISH_MEMBER.test(member))
    ? members.join(' | ')
    : 'boolean | string'
}

function attributeType(prop: PropMeta, doc: PropDoc | undefined): string {
  switch (prop.kind) {
    case 'boolean':
      return 'boolean'
    case 'booleanish':
      return booleanishAttributeType(doc?.type)
    case 'number':
      return 'number'
    case 'string':
      return stringAttributeType(doc?.type)
    default:
      return 'string'
  }
}

const NUMBER = /^-?\d+(?:\.\d+)?$/

/**
 * The attribute value of a prop's default, which the schema wants verbatim: `'horizontal'`
 * → `horizontal`. None for a boolean (its default is the attribute's absence) or for a
 * default that is not a literal of the attribute's format (`[0]`).
 */
function attributeDefault(prop: PropMeta, value: string | undefined): string | undefined {
  if (!value)
    return undefined
  if (prop.kind === 'number')
    return NUMBER.test(value) ? value : undefined
  if (prop.kind === 'string' || prop.kind === 'booleanish')
    return STRING_LITERAL.test(value) ? value.slice(1, -1) : undefined
  return undefined
}

function joinText(...texts: (string | undefined)[]): string | undefined {
  const text = texts.filter(Boolean).join('\n\n')
  return text || undefined
}

const REST = /^\.{3}/
const TUPLE_LABEL = /^\w+\??:\s*/

/** `[value: boolean, details: ChangeEventDetails<…>]` → `['boolean', 'ChangeEventDetails<…>']`. */
function tupleMembers(type: string): string[] | undefined {
  const tuple = type.trim()
  if (!tuple.startsWith('[') || !tuple.endsWith(']'))
    return undefined
  return splitTopLevel(tuple.slice(1, -1), ',').map(member => member.replace(REST, '').replace(TUPLE_LABEL, ''))
}

const DOM_EVENT = /Event$/

function eventEntry(emit: string, meta: PartMeta, doc: EventDoc | undefined, toEventType: (emit: string) => string): ManifestEvent {
  const name = toEventType(emit)
  const members = doc?.type ? tupleMembers(doc.type) : undefined
  let type = 'RekaElementEvent'
  if (members)
    type = members.length ? `RekaElementEvent<${members.slice(0, 2).join(', ')}>` : 'RekaElementEvent<undefined>'
  const notes: string[] = []
  if (emit.startsWith('beforeUpdate:'))
    notes.push('Cancelable: `preventDefault()` cancels the change (`details.cancel()`).')
  else if (members?.[0] && DOM_EVENT.test(members[0]))
    notes.push('Cancelable: `preventDefault()` prevents the default of the event it carries.')
  if (meta.listenedEvents.has(name))
    notes.push('Listening to it changes what the part does, as in Vue: the part sees a listener only while the element has one.')
  return { name, type: { text: type }, description: joinText(doc?.description, ...notes) }
}

function elementDescription(family: RekaElementFamily, partName: string, meta: PartMeta, doc: PartDoc | undefined): string {
  const familyName = family.name.replace(/-(\w)/g, (_, char: string) => char.toUpperCase())
  const define = `define${familyName[0].toUpperCase()}${familyName.slice(1)}Elements`
  const notes = [`\`${partName}\` as a custom element. Registered by \`defineRekaElements([${familyName}Elements])\` or \`${define}()\`.`]
  if (meta.formAssociated)
    notes.push('Form-associated: it submits its value with its form.')
  return joinText(doc?.description, notes.join(' '))!
}

/** Builds the manifest from the element registry. */
export function createElementsManifest(source: ElementsManifestSource): ElementsManifest {
  const { families, getPartMeta, toPartDefinition, hyphenate, toEventType, docs } = source
  const declarations: ManifestElement[] = []

  for (const family of families) {
    for (const [partName, rawPart] of Object.entries(family.parts)) {
      const meta = getPartMeta(toPartDefinition(rawPart))
      const doc = docs?.get(partName)
      const props = new Map(meta.props.map(prop => [prop.name, prop]))

      const attributes: ManifestAttribute[] = meta.props.filter(prop => prop.attribute).map((prop) => {
        const propDoc = doc?.props.get(prop.name)
        return {
          name: prop.attribute!,
          fieldName: prop.name,
          type: { text: attributeType(prop, propDoc) },
          description: joinText(
            propDoc?.description,
            ATTRIBUTE_FORMATS[prop.kind],
            prop.defaultTrue ? 'Set it to `"false"` to turn it off.' : undefined,
          ),
          default: attributeDefault(prop, propDoc?.default),
        }
      })

      const members: ManifestField[] = meta.properties.map((name) => {
        const prop = props.get(name)!
        const propDoc = doc?.props.get(name)
        return {
          kind: 'field',
          name,
          type: { text: propDoc?.type ?? (prop.kind === 'property' ? 'unknown' : attributeType(prop, undefined)) },
          description: joinText(propDoc?.required ? 'Required: set it before the element is connected.' : undefined, propDoc?.description),
          default: propDoc?.default,
          ...(prop.attribute ? { attribute: prop.attribute } : undefined),
          ...(name === 'disabled' ? { reflects: true } : undefined),
        }
      })
      members.push({ ...SLOT_PROPS, inheritedFrom: BASE })
      if (meta.formAssociated)
        members.push({ ...FORM, inheritedFrom: BASE })

      const events = meta.emits.map(emit => eventEntry(emit, meta, doc?.events.get(emit) ?? ELEMENT_EVENT_DOCS[partName]?.[emit], toEventType))
      events.push({ ...SLOT_PROPS_CHANGE, inheritedFrom: BASE })

      const slots: ManifestSlot[] = [{
        name: '',
        description: meta.inputTarget
          ? 'An `<input>` (or `<textarea>`) the part renders onto; one is created when there is none.'
          : 'The element\'s children, like the part\'s default slot. Without a shadow root they stay in the light DOM.',
      }]

      declarations.push({
        kind: 'class',
        name: `${partName}Element`,
        description: elementDescription(family, partName, meta, doc),
        customElement: true,
        tagName: `${PREFIX}-${hyphenate(partName)}`,
        superclass: BASE,
        attributes,
        members,
        events,
        slots,
      })
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    modules: [{
      kind: 'javascript-module',
      path: ELEMENTS_MODULE,
      declarations: [
        {
          kind: 'class',
          name: BASE.name,
          description: 'Base class of every Reka custom element. `defineRekaElements()` defines a subclass of it per part.',
          members: [SLOT_PROPS],
          events: [SLOT_PROPS_CHANGE],
        },
        ...declarations,
      ],
      exports: [
        { kind: 'js', name: BASE.name, declaration: { name: BASE.name, module: ELEMENTS_MODULE } },
        ...declarations.map(declaration => ({
          kind: 'custom-element-definition' as const,
          name: declaration.tagName,
          declaration: { name: declaration.name, module: ELEMENTS_MODULE },
        })),
      ],
    }],
  }
}

// Docs

const TABLE = /<(Props|Emits)Table :data="([\s\S]*?)" \/>/g
const INCLUDE = /^<!-- @include: @\/meta\/(\w+)\.md -->$/

/**
 * Parses the `:data` of a generated docs table: JSON whose double quotes were turned
 * into single quotes (and single quotes escaped).
 */
function parseSingleQuoted(source: string): unknown {
  let json = ''
  let inString = false
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (!inString) {
      inString = char === '\''
      json += inString ? '"' : char
    }
    else if (char === '\\') {
      const next = source[++i]
      json += next === '\'' ? '\'' : `\\${next}`
    }
    else if (char === '\'') {
      inString = false
      json += '"'
    }
    else {
      json += char === '"' ? '\\"' : char
    }
  }
  return JSON.parse(json)
}

// Vue usage, which means nothing on an element: "Can be bound as `v-model:open`."
const V_MODEL = /\s*Can be (?:binded|bound|bind|used) (?:as|with) `?v-model[\w:]*`?\.?|^`?v-model[\w:]*`?$/g

const ENTITIES: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': '\'' }

function decode(text: string): string {
  return text.replace(/&(?:lt|gt|amp|quot|#39);/g, entity => ENTITIES[entity])
}

/** The docs' rendered Markdown back to Markdown: code spans and links kept, other tags dropped. */
function toMarkdown(html: string | undefined): string | undefined {
  if (!html)
    return undefined
  const text = decode(html
    .replace(/<code>([\s\S]*?)<\/code>/g, '`$1`')
    .replace(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
    .replace(/<\/p>\s*<p>/g, '\n\n')
    .replace(/<[^>]+>/g, ''))
    .trim()
    .replace(V_MODEL, '')
  return text || undefined
}

/** Part descriptions: the text between a component page's `### Part` heading and its meta include. */
function readPartDescriptions(pagesDir: string): Map<string, string> {
  const descriptions = new Map<string, string>()
  for (const file of readdirSync(pagesDir).filter(file => file.endsWith('.md'))) {
    // The first paragraph after the heading, skipping components (`<PresenceCallout />`).
    let paragraph: string[] = []
    let complete = false
    for (const line of readFileSync(join(pagesDir, file), 'utf8').split('\n')) {
      const text = line.trim()
      const include = INCLUDE.exec(text)
      if (include) {
        if (paragraph.length && !descriptions.has(include[1]))
          descriptions.set(include[1], paragraph.join(' '))
        paragraph = []
        complete = false
      }
      else if (text.startsWith('#')) {
        paragraph = []
        complete = false
      }
      else if (!text) {
        complete = paragraph.length > 0
      }
      else if (!complete && !text.startsWith('<')) {
        paragraph.push(text)
      }
    }
  }
  return descriptions
}

/** Reads the docs of every part from `docs/content` (`meta/*.md` and the component pages). */
export function readDocs(contentDir: string): Map<string, PartDoc> {
  const docs = new Map<string, PartDoc>()
  const metaDir = join(contentDir, 'meta')
  const descriptions = readPartDescriptions(join(contentDir, 'docs/components'))
  for (const file of readdirSync(metaDir).filter(file => file.endsWith('.md'))) {
    const name = file.slice(0, -3)
    const doc: PartDoc = { description: descriptions.get(name), props: new Map(), events: new Map() }
    for (const [, table, data] of readFileSync(join(metaDir, file), 'utf8').matchAll(TABLE)) {
      const rows = parseSingleQuoted(data) as { name: string, type?: string, description?: string, default?: string, required?: boolean }[]
      for (const row of rows) {
        const entry = { type: row.type ? decode(row.type) : undefined, description: toMarkdown(row.description) }
        if (table === 'Props')
          doc.props.set(row.name, { ...entry, default: row.default, required: row.required })
        else
          doc.events.set(row.name, entry)
      }
    }
    docs.set(name, doc)
  }
  return docs
}

// Build step: `tsx scripts/elements-manifest.ts`, after `tsdown`.

async function main() {
  const packageDir = fileURLToPath(new URL('..', import.meta.url))
  const dist = join(packageDir, 'dist')
  // `getPartMeta()` leaves out the props `HTMLElement` already defines (`id`, `dir`,
  // `hidden`): give it the DOM's, as in a browser.
  const { JSDOM } = await import('jsdom')
  const { window } = new JSDOM('')
  ;(globalThis as { HTMLElement?: unknown }).HTMLElement ??= window.HTMLElement

  const load = (file: string) => import(pathToFileURL(join(dist, file)).href)
  const [elements, meta, host] = await Promise.all([load('elements.js'), load('elements/meta.js'), load('elements/host.js')])

  const contentDir = join(packageDir, '../../docs/content')
  const docs = existsSync(join(contentDir, 'meta')) ? readDocs(contentDir) : undefined
  if (!docs)
    console.warn('[elements-manifest] docs/content not found: the manifest has no types or descriptions.')

  const manifest = createElementsManifest({
    families: elements.rekaElementFamilies,
    getPartMeta: meta.getPartMeta,
    toPartDefinition: meta.toPartDefinition,
    hyphenate: host.hyphenate,
    toEventType: elements.toEventType,
    docs,
  })
  // Unindented: a third smaller, and tools read it, not people.
  writeFileSync(join(dist, MANIFEST_FILE), `${JSON.stringify(manifest)}\n`)
  const tags = manifest.modules[0].declarations.filter(declaration => 'tagName' in declaration).length
  // eslint-disable-next-line no-console
  console.log(`[elements-manifest] dist/${MANIFEST_FILE}: ${tags} elements`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  await main()
