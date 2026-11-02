import { serialize } from 'ohash'

const opaqueIds = /* @__PURE__ */ new WeakMap<object, number>()
let opaqueCount = 0
const WALKED_TAG = /^(?:Array|Object|Map|Set)$/
const MAX_FORM_LENGTH = 32_000_000

/**
 * ohash `serialize` that never throws. ohash gives up on a value it has no form
 * for (Temporal, `Blob`/`File`, a `WeakMap`, a DOM node), so such a value gets:
 * - Temporal: its type and ISO string, which include the calendar and time zone.
 *   Unlike `.equals` this works for every Temporal type, across types and
 *   against non-Temporal values;
 * - an array, plain or class object, `Map` or `Set` holding one: a walk of its entries;
 * - anything else (including a link back into a cycle holding one): its
 *   identity, as its contents can't be read synchronously.
 *
 * Everything ohash can serialize keeps its ohash form.
 *
 * A walked object is serialized once however many paths reach it, so a graph
 * with shared nodes stays linear. Its form can still double per level, so one
 * whose entries total over `MAX_FORM_LENGTH` uses its identity instead and its
 * parents stay short: two equal values that large compare as different, never a
 * throw. The limit clears 100,000 six-field rows (about 19M characters).
 *
 * @internal
 */
// `seen` holds the walked objects of this call: the form of a finished one, `undefined` while it's being walked.
export function serializeValue(value: unknown, seen?: Map<unknown, string | undefined>): string {
  const known = seen?.get(value)
  if (known)
    return known
  if (!seen?.has(value)) {
    try {
      return serialize(value)
    }
    catch {}
    try {
      const tag = Object.prototype.toString.call(value).slice(8, -1)
      if (tag.startsWith('Temporal.'))
        return `${tag}(${String(value)})`
      if (WALKED_TAG.test(tag)) {
        seen ??= new Map()
        seen.set(value, undefined)
        const entries = (tag === 'Object' ? Object.entries(value as object) : [...value as Iterable<unknown>])
          .map(entry => serializeValue(entry, seen))
        // Entries only, before joining: separators and brackets can take a form
        // past the limit by about one character per entry.
        if (entries.reduce((length, entry) => length + entry.length, 0) <= MAX_FORM_LENGTH) {
          const form = tag === 'Array'
            ? `[${entries}]`
            // `#`: a class can be named `Map` or `Object`, and must not read as the built-in or a plain object.
            : `${tag === 'Object' && Object.getPrototypeOf(value) !== Object.prototype ? `#${(value as object).constructor?.name}` : tag}{${entries.sort()}}`
          seen.set(value, form)
          return form
        }
      }
    }
    catch {}
  }
  let id = opaqueIds.get(value as object)
  if (id === undefined)
    opaqueIds.set(value as object, id = ++opaqueCount)
  return `Opaque(${id})`
}

/** ohash `isEqual` that never throws: both sides compared by `serializeValue`. */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || serializeValue(a) === serializeValue(b)
}

/**
 * How two values are matched: a key both objects are compared by, or a custom
 * equality function. The single identity strategy shared by Listbox, Combobox
 * and Select (#2824).
 */
export type By<T> = string | ((a: T, b: T) => boolean)

export function valueComparator<T>(value: T | T[] | undefined, currentValue: T, comparator?: By<T>) {
  if (value === undefined)
    return false
  else if (Array.isArray(value))
    return value.some(val => compare(val, currentValue, comparator))
  else
    return compare(value, currentValue, comparator)
}

export function compare<T>(value?: T, currentValue?: T, comparator?: By<T>) {
  if (value === undefined || currentValue === undefined)
    return false

  // `null` is an empty selection (Combobox): never hand it to a comparator
  // that reads properties off its arguments.
  if (value === null || currentValue === null)
    return value === currentValue

  // A comparison function is the caller's whole identity strategy, so it runs
  // for every value, strings included (v2 skipped it for strings).
  if (typeof comparator === 'function')
    return comparator(value, currentValue)

  if (typeof value === 'string')
    return value === currentValue

  if (typeof comparator === 'string')
    return value?.[comparator as keyof T] === currentValue?.[comparator as keyof T]

  return isEqual(value, currentValue)
}
