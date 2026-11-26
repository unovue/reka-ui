import { isEqual } from 'ohash'

export function queryCheckedElement(parentEl: HTMLElement | null) {
  return parentEl?.querySelector('[data-state=checked]') as HTMLElement | null
}

export function valueComparator<T>(value: T | T[] | undefined, currentValue: T, comparator?: string | ((a: T, b: T) => boolean)) {
  if (value === undefined)
    return false
  else if (Array.isArray(value))
    return value.some(val => compare(val, currentValue, comparator))
  else
    return compare(value, currentValue, comparator)
}

export function compare<T>(value?: T, currentValue?: T, comparator?: string | ((a: T, b: T) => boolean)) {
  if (value === undefined || currentValue === undefined)
    return false

  if (typeof value === 'string')
    return value === currentValue

  if (typeof comparator === 'function')
    return comparator(value, currentValue)

  if (typeof comparator === 'string')
    return value?.[comparator as keyof T] === currentValue?.[comparator as keyof T]

  return isEqual(value, currentValue)
}

/**
 * Slot props that are read when a consumer slot uses them, not when the slot is rendered. The
 * part that renders the slot then tracks a source only if the slot reads it, so a root whose slot
 * ignores `modelValue` does not re-render, and every item with it, on each selection.
 *
 * Call the returned function once per slot render: each call gives a new object, as an eager
 * `<slot :model-value="modelValue" />` does. The newest object reads its sources; an object a later
 * render has replaced keeps the values it last read. Old and new props then compare as changed,
 * which a child that was given the whole object (`v-bind="slotProps"`) needs to update.
 *
 * A prop that has been read once is read by every later slot render itself. Vue reads the props
 * of a child that is updated inside that child's own effect, where the read would not make the
 * part that renders the slot follow the source.
 *
 * @internal
 */
export function createLazySlotProps<T extends Record<string, () => unknown>>(sources: T): () => { readonly [K in keyof T]: ReturnType<T[K]> } {
  let latest: object | undefined
  let latestValues: Record<string, unknown> = {}
  return () => {
    const values: Record<string, unknown> = {}
    for (const key in latestValues)
      values[key] = sources[key]()
    const props = {}
    for (const key in sources) {
      Object.defineProperty(props, key, {
        enumerable: true,
        get: () => props === latest || !(key in values) ? (values[key] = sources[key]()) : values[key],
      })
    }
    latest = props
    latestValues = values
    return props as { readonly [K in keyof T]: ReturnType<T[K]> }
  }
}
