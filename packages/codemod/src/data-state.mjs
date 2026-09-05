/**
 * Best-effort rewrite of v2 `data-state` values to the v3 vocabulary.
 *
 * Handles Tailwind variants (`data-[state=on]:`, `group-data-[state=on]:`,
 * `peer-data-[state=on]:`, quoted or not) and CSS attribute selectors
 * (`[data-state=on]`, `[data-state='on']`, `[data-state="on"]`).
 *
 * `active` / `inactive` mean three different things in v3 (`checked` /
 * `unchecked` for Tabs, TagsInput and Rating; `current` / `upcoming` for
 * Stepper; unchanged for the Splitter resize handle), so they are decided once
 * per file from the component names the file mentions.
 *
 * Anything that cannot be decided mechanically is left untouched and reported
 * as a warning so a human can finish the job.
 */

/** Values that always map to the same v3 value, whatever the component. */
const RENAMES = {
  'on': 'checked',
  'off': 'unchecked',
  'visible': 'open',
  'hidden': 'closed',
  'expanded': 'open',
  'collapsed': 'closed',
  'instant-open': 'open',
}

/**
 * Values whose meaning depends on the component the file is styling, keyed by
 * the group of components that share a rewrite. Each group lists the component
 * names that identify it and the v3 value for each ambiguous v2 value (`null`
 * keeps the v2 value, for components that still emit it).
 */
const AMBIGUOUS = {
  selection: {
    components: ['Tabs', 'TagsInput', 'Rating'],
    values: { active: 'checked', inactive: 'unchecked' },
  },
  stepper: {
    components: ['Stepper'],
    values: { active: 'current', inactive: 'upcoming' },
  },
  splitter: {
    components: ['SplitterResizeHandle'],
    values: { active: null, inactive: null },
  },
}

const ALWAYS_VALUES = Object.keys(RENAMES)
const AMBIGUOUS_VALUES = ['active', 'inactive']

/**
 * `data-[state=X]` / `data-[state='X']` / `data-[state="X"]`, optionally
 * preceded by `group-` / `peer-`. Groups: prefix, quote, value.
 */
function tailwindPattern(values) {
  return new RegExp(`((?:group|peer)-)?data-\\[state=(['"]?)(${values.join('|')})\\2\\]`, 'g')
}

/**
 * `[data-state=X]` / `[data-state='X']` / `[data-state="X"]`, with optional
 * whitespace around `=`. Groups: opening, quote, value, closing.
 */
function cssPattern(values) {
  return new RegExp(`(\\[data-state\\s*=\\s*)(['"]?)(${values.join('|')})\\2(\\s*\\])`, 'g')
}

const TAILWIND_RENAME = tailwindPattern(ALWAYS_VALUES)
const CSS_RENAME = cssPattern(ALWAYS_VALUES)
const TAILWIND_AMBIGUOUS = tailwindPattern(AMBIGUOUS_VALUES)
const CSS_AMBIGUOUS = cssPattern(AMBIGUOUS_VALUES)

/** `data-[state=delayed-open]`, with an optional named-group suffix (`/name`). */
const TAILWIND_DELAYED = /((?:group|peer)-)?data-\[state=(['"]?)delayed-open\2\](\/[\w-]+)?/g
const CSS_DELAYED = /(\[data-state\s*=\s*)(['"]?)delayed-open\2\s*\]/g

/** A bare `[data-state]` (with or without `:not(...)`): presence-only, so it now matches every part. */
const PRESENCE_ONLY = /\[\s*data-state\s*\]/

const PRESENCE_WARNING = '"[data-state]" is now always present, so a presence-only selector matches every part; target the explicit value instead'

function mentionsAny(source, names) {
  return names.some(name => source.includes(name))
}

/**
 * Decide, once per file, what to do with `active` / `inactive` from the
 * component names the file mentions: exactly one group → that group's
 * mapping (a `null` entry keeps the value); more than one, or none → `null`,
 * and every occurrence is reported instead of rewritten.
 * @returns {Record<string, string | null> | null}
 */
function decideAmbiguous(source) {
  const groups = Object.values(AMBIGUOUS).filter(group => mentionsAny(source, group.components))
  return groups.length === 1 ? groups[0].values : null
}

function ambiguousWarning(value) {
  const outcomes = Object.values(AMBIGUOUS)
    .map(({ components, values }) => `${values[value] === null ? 'keep' : `rewrite to "${values[value]}"`} for ${components.join('/')}`)
  return `ambiguous data-state "${value}": ${outcomes.join(', ')}`
}

function transformLine(line, mapping) {
  const warnings = []

  let out = line
    .replace(TAILWIND_DELAYED, (_, prefix = '', quote, name = '') =>
      `${prefix}data-[state=${quote}open${quote}]${name}:${prefix}data-[delayed]${name}`)
    .replace(CSS_DELAYED, (_, open, quote) => `${open}${quote}open${quote}][data-delayed]`)
    .replace(TAILWIND_RENAME, (_, prefix = '', quote, value) => `${prefix}data-[state=${quote}${RENAMES[value]}${quote}]`)
    .replace(CSS_RENAME, (_, open, quote, value, close) => `${open}${quote}${RENAMES[value]}${quote}${close}`)

  if (mapping) {
    out = out
      .replace(TAILWIND_AMBIGUOUS, (_, prefix = '', quote, value) => `${prefix}data-[state=${quote}${mapping[value] ?? value}${quote}]`)
      .replace(CSS_AMBIGUOUS, (_, open, quote, value, close) => `${open}${quote}${mapping[value] ?? value}${quote}${close}`)
  }
  else {
    const found = new Set()
    for (const pattern of [TAILWIND_AMBIGUOUS, CSS_AMBIGUOUS]) {
      for (const match of out.matchAll(pattern))
        found.add(match[3])
    }
    for (const value of AMBIGUOUS_VALUES) {
      if (found.has(value))
        warnings.push(ambiguousWarning(value))
    }
  }

  if (PRESENCE_ONLY.test(out))
    warnings.push(PRESENCE_WARNING)

  return { line: out, warnings }
}

/**
 * Rewrite v2 `data-state` values in `source` to their v3 equivalents.
 *
 * @param {string} source
 * @param {{ filename?: string }} [_options] reserved for future use
 * @returns {{ code: string, changed: boolean, warnings: Array<{ line: number, message: string }> }}
 */
export function transformDataState(source, _options = {}) {
  const mapping = decideAmbiguous(source)
  const warnings = []
  const lines = source.split('\n')

  const code = lines
    .map((line, index) => {
      const result = transformLine(line, mapping)
      for (const message of result.warnings)
        warnings.push({ line: index + 1, message })
      return result.line
    })
    .join('\n')

  return { code, changed: code !== source, warnings }
}
