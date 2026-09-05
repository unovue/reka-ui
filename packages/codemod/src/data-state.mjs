/**
 * Best-effort rewrite of v2 `data-state` values to the v3 vocabulary.
 *
 * Handles Tailwind variants (`data-[state=on]:`, `group-data-[state=on]:`,
 * `peer-data-[state=on]:`, quoted or not) and CSS attribute selectors
 * (`[data-state=on]`, `[data-state='on']`, `[data-state="on"]`).
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

/** Values whose meaning depends on the component the file is styling. */
const AMBIGUOUS = {
  active: 'checked',
  inactive: 'unchecked',
}

/** Components that moved `active` / `inactive` to `checked` / `unchecked`. */
const SELECTION_COMPONENTS = ['Tabs', 'TagsInput', 'Rating']

/** Components that still emit `active` / `inactive`. */
const MULTI_STATE_COMPONENTS = ['Stepper', 'SplitterResizeHandle']

const ALWAYS_VALUES = Object.keys(RENAMES)
const AMBIGUOUS_VALUES = Object.keys(AMBIGUOUS)

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
 * Decide, once per file, what to do with `active` / `inactive`.
 * @returns {'rewrite' | 'keep' | 'warn'}
 */
function decideAmbiguous(source) {
  const selection = mentionsAny(source, SELECTION_COMPONENTS)
  const multiState = mentionsAny(source, MULTI_STATE_COMPONENTS)
  if (selection && !multiState)
    return 'rewrite'
  if (multiState && !selection)
    return 'keep'
  return 'warn'
}

function ambiguousWarning(value) {
  return `ambiguous data-state "${value}": rewrite to "${AMBIGUOUS[value]}" for Tabs/TagsInput/Rating, keep for Stepper/Splitter`
}

function transformLine(line, mode) {
  const warnings = []

  let out = line
    .replace(TAILWIND_DELAYED, (_, prefix = '', quote, name = '') =>
      `${prefix}data-[state=${quote}open${quote}]${name}:${prefix}data-[delayed]${name}`)
    .replace(CSS_DELAYED, (_, open, quote) => `${open}${quote}open${quote}][data-delayed]`)
    .replace(TAILWIND_RENAME, (_, prefix = '', quote, value) => `${prefix}data-[state=${quote}${RENAMES[value]}${quote}]`)
    .replace(CSS_RENAME, (_, open, quote, value, close) => `${open}${quote}${RENAMES[value]}${quote}${close}`)

  if (mode === 'rewrite') {
    out = out
      .replace(TAILWIND_AMBIGUOUS, (_, prefix = '', quote, value) => `${prefix}data-[state=${quote}${AMBIGUOUS[value]}${quote}]`)
      .replace(CSS_AMBIGUOUS, (_, open, quote, value, close) => `${open}${quote}${AMBIGUOUS[value]}${quote}${close}`)
  }
  else if (mode === 'warn') {
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
  const mode = decideAmbiguous(source)
  const warnings = []
  const lines = source.split('\n')

  const code = lines
    .map((line, index) => {
      const result = transformLine(line, mode)
      for (const message of result.warnings)
        warnings.push({ line: index + 1, message })
      return result.line
    })
    .join('\n')

  return { code, changed: code !== source, warnings }
}
