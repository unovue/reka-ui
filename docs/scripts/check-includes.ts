/**
 * Checks the API-table includes (`<!-- @include: @/meta/X.md -->`) on the
 * hand-written docs pages against the generated meta files and the parts each
 * component family really exports.
 *
 * Fails when:
 *  1. an include points at a meta file that does not exist,
 *  2. a part exported from `packages/core/src/<Family>/index.ts` has no API
 *     section on the page(s) documenting that family,
 *  3. the same meta file is included under two different headings of a page
 *     (usually a copy-paste of the wrong part name).
 *
 * Run with `pnpm docs:check`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '../..')
const SRC_DIR = join(ROOT, 'packages/core/src')
const META_DIR = join(ROOT, 'docs/content/meta')
const PAGES_DIR = join(ROOT, 'docs/content/docs')

/**
 * Meta files that `pnpm docs:gen` has not produced yet. An include of one of
 * these is tolerated; remove the entry once the file is generated (the checker
 * warns when an entry is stale).
 */
const PENDING_META: Record<string, string> = {}

/**
 * Exported parts that intentionally have no API section of their own.
 * Key = part name, value = the reason.
 */
const UNDOCUMENTED_PARTS: Record<string, string> = {
  DrawerPopup: 'alias of DrawerContent, mentioned in its section',
  DrawerBackdrop: 'alias of DrawerOverlay, mentioned in its section',
  ScrollAreaScrollbarGlimpse: 'rendered by ScrollAreaScrollbar when the root `type` is `glimpse`, not used directly',
  VisuallyHiddenInput: 'internal, not exported from the package entry',
}

/**
 * Families that intentionally have no docs page with API tables
 * (internal building blocks, or documented in prose only).
 */
const UNDOCUMENTED_FAMILIES: Record<string, string> = {
  DismissableLayer: 'internal, only its event types are exported from the package entry',
  FocusGuards: 'internal',
  Menu: 'internal, shared by DropdownMenu, ContextMenu and Menubar',
  Popper: 'internal, shared by the floating components',
  Teleport: 'internal, surfaced through the *Portal parts',
  Presence: 'render-function component without generated meta, utilities/presence.md keeps a hand-written table',
  Viewport: 'shared building block behind the *Viewport parts, no standalone page yet',
}

const INCLUDE_RE = /<!--\s*@include:\s*@\/meta\/(\S+?)\.md\s*-->/
const HEADING_RE = /^(#{1,6})\s+(\S.*)$/
const DEFAULT_EXPORT_RE = /\bdefault\s+as\s+([A-Z]\w*)/g
const FENCE_RE = /^\s*(`{3,}|~{3,})/

interface Include {
  page: string
  line: number
  name: string
  heading: string
  /** Line of the heading, identifies the section even when heading texts repeat. */
  headingLine: number
}

function kebabCase(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function readFamilies() {
  const families = new Map<string, string[]>()
  for (const entry of readdirSync(SRC_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory())
      continue
    const indexPath = join(SRC_DIR, entry.name, 'index.ts')
    if (!existsSync(indexPath))
      continue
    // Strip comments so commented-out exports are not counted.
    const source = readFileSync(indexPath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    const parts = Array.from(source.matchAll(DEFAULT_EXPORT_RE), match => match[1])
    if (parts.length)
      families.set(entry.name, [...new Set(parts)])
  }
  return families
}

function readIncludes() {
  const includes: Include[] = []
  const pages = fg.sync('**/*.md', { cwd: PAGES_DIR, absolute: true }).sort()
  for (const page of pages) {
    let heading = ''
    let headingLine = 0
    let fence: string | null = null
    readFileSync(page, 'utf8').split('\n').forEach((text, index) => {
      const fenceMatch = text.match(FENCE_RE)
      if (fenceMatch) {
        const marker = fenceMatch[1]
        if (!fence)
          fence = marker
        // A fence closes on the same character, at least as long as the opening, with nothing after it.
        else if (marker[0] === fence[0] && marker.length >= fence.length && text.trim() === marker)
          fence = null
        return
      }
      if (fence)
        return
      const headingMatch = text.match(HEADING_RE)
      if (headingMatch) {
        heading = headingMatch[2].trim()
        headingLine = index + 1
        return
      }
      const includeMatch = text.match(INCLUDE_RE)
      if (includeMatch) {
        includes.push({
          page: relative(ROOT, page),
          line: index + 1,
          name: includeMatch[1],
          heading,
          headingLine,
        })
      }
    })
  }
  return includes
}

const families = readFamilies()
const includes = readIncludes()
const errors: string[] = []
const warnings: string[] = []

// 1. Every include resolves to a meta file.
for (const include of includes) {
  if (existsSync(join(META_DIR, `${include.name}.md`)))
    continue
  if (include.name in PENDING_META)
    continue
  errors.push(`${include.page}:${include.line} includes @/meta/${include.name}.md, which does not exist`)
}

// 2. Every exported part has an API section on its family's page(s).
const partToFamily = new Map<string, string>()
for (const [family, parts] of families) {
  for (const part of parts)
    partToFamily.set(part, family)
}

const includedParts = new Set(includes.map(include => include.name))
const pagesByFamily = new Map<string, Set<string>>()
for (const include of includes) {
  const family = partToFamily.get(include.name)
  if (!family)
    continue
  if (!pagesByFamily.has(family))
    pagesByFamily.set(family, new Set())
  pagesByFamily.get(family)!.add(include.page)
}

for (const [family, parts] of families) {
  const pages = pagesByFamily.get(family)
  if (!pages) {
    if (!(family in UNDOCUMENTED_FAMILIES))
      errors.push(`${family}: no docs page includes any of its parts (${parts.join(', ')})`)
    continue
  }
  // A family with a page of its own (`ToggleGroup` -> `toggle-group.md`) must document its
  // parts there: an include that strayed onto another family's page does not count.
  const ownPage = [...pages].find(page => basename(page, '.md') === kebabCase(family))
  const documented = ownPage
    ? new Set(includes.filter(include => include.page === ownPage).map(include => include.name))
    : includedParts
  for (const part of parts) {
    if (documented.has(part) || part in UNDOCUMENTED_PARTS)
      continue
    errors.push(`${ownPage ?? [...pages].join(', ')}: ${part} is exported from ${family}/index.ts but has no API section`)
  }
}

// 3. A meta file is not included under two different headings of one page.
const seen = new Map<string, Include>()
for (const include of includes) {
  const key = `${include.page}::${include.name}`
  const previous = seen.get(key)
  if (!previous) {
    seen.set(key, include)
    continue
  }
  if (previous.headingLine !== include.headingLine) {
    errors.push(
      `${include.page}:${include.line} includes @/meta/${include.name}.md under "${include.heading}", `
      + `already included at line ${previous.line} under "${previous.heading}"`,
    )
  }
}

// Stale allow-list entries.
for (const name of Object.keys(PENDING_META)) {
  if (existsSync(join(META_DIR, `${name}.md`)))
    warnings.push(`PENDING_META: ${name}.md exists now, remove the entry`)
}
for (const name of Object.keys(UNDOCUMENTED_PARTS)) {
  if (!partToFamily.has(name))
    warnings.push(`UNDOCUMENTED_PARTS: ${name} is not exported by any family, remove the entry`)
  else if (includedParts.has(name))
    warnings.push(`UNDOCUMENTED_PARTS: ${name} has an API section now, remove the entry`)
}
for (const name of Object.keys(UNDOCUMENTED_FAMILIES)) {
  if (!families.has(name))
    warnings.push(`UNDOCUMENTED_FAMILIES: ${name} does not exist, remove the entry`)
  else if (pagesByFamily.has(name))
    warnings.push(`UNDOCUMENTED_FAMILIES: ${name} is documented now, remove the entry`)
}

for (const warning of warnings)
  console.warn(`warning  ${warning}`)
for (const error of errors)
  console.error(`error    ${error}`)

const summary = `${includes.length} includes on ${new Set(includes.map(include => include.page)).size} pages, ${families.size} families`
if (errors.length) {
  console.error(`\ndocs:check failed with ${errors.length} error(s) (${summary})`)
  process.exit(1)
}
console.warn(`docs:check passed (${summary})`)
