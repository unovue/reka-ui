import { serialize } from 'ohash'

const opaqueIds = /* @__PURE__ */ new WeakMap<object, number>()
let opaqueCount = 0
const WALKED_TAG = /^(?:Array|Object|Map|Set)$/
const WALK_BUDGET = 64_000_000

/** One top-level walk: the form of each finished object (`undefined` while it's being walked), and the characters used. */
interface Walk {
  forms: Map<unknown, string | undefined>
  spent: number
}

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
 * Everything ohash can serialize keeps its ohash form, which is not limited.
 *
 * A walked object is serialized once however many paths reach it, so a graph
 * with shared nodes stays linear. Forms can still grow quickly and each is a new
 * string, so one call spends at most `WALK_BUDGET` characters. Past that the whole
 * value uses its identity, never part of it: the outcome depends on the total, not
 * on the order of siblings, and two equal values that large compare as different.
 * The budget clears 100,000 six-field rows.
 *
 * @internal
 */
export function serializeValue(value: unknown, walk?: Walk): string {
  const known = walk?.forms.get(value)
  if (known)
    return known
  if (!walk || (walk.spent <= WALK_BUDGET && !walk.forms.has(value))) {
    try {
      return serialize(value)
    }
    catch {}
    try {
      const tag = Object.prototype.toString.call(value).slice(8, -1)
      if (tag.startsWith('Temporal.'))
        return `${tag}(${String(value)})`
      if (WALKED_TAG.test(tag)) {
        const current = walk ?? { forms: new Map(), spent: 0 }
        current.forms.set(value, undefined)
        const entries = (tag === 'Object' ? Object.entries(value as object) : [...value as Iterable<unknown>])
          .map((entry) => {
            const form = serializeValue(entry, current)
            current.spent += form.length
            return form
          })
        if (current.spent <= WALK_BUDGET) {
          const form = tag === 'Array'
            ? `[${entries}]`
            // `#`: a class can be named `Map` or `Object`, and must not read as the built-in or a plain object.
            : `${tag === 'Object' && Object.getPrototypeOf(value) !== Object.prototype ? `#${(value as object).constructor?.name}` : tag}{${entries.sort()}}`
          current.forms.set(value, form)
          return form
        }
      }
    }
    catch {}
  }
  // A primitive reaching this once the budget is spent throws, ending its parent's walk.
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
