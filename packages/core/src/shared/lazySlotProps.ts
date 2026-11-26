import { isClient } from '@vueuse/shared'
import { getCurrentScope, shallowRef, watch } from 'vue'

/**
 * Slot props for a slot that an element of the calling part renders (`<Primitive><slot /></Primitive>`),
 * which cost nothing until a consumer reads them.
 *
 * Building `{ modelValue: modelValue.value }` where the slot is rendered makes that element's render
 * track the model, so every change re-renders it, and through its slot everything below it, even
 * when no consumer slot uses the prop. The returned function is called once per slot render
 * (`<slot v-bind="slotProps()" />`) and behaves in one of two ways:
 *
 * - Until a consumer reads a prop, it returns a new object whose getters read their source on first
 *   access and then keep that value. The object is a snapshot of that slot render, like the plain
 *   object was, so spreading it onto a child (`<Child v-bind="slotProps" />`) gives the child a
 *   value that differs from the next render's.
 * - The first read, from anywhere (the slot itself, a nested slot, a child's props, an event
 *   handler), switches to plain objects built where the slot is rendered. A reader other than the
 *   rendering element would not make that element render again, so the first change after the
 *   read does.
 *
 * Call it in `setup`.
 *
 * @internal
 */
export function useLazySlotProps<T extends Record<string, () => unknown>>(sources: T): () => { [K in keyof T]: ReturnType<T[K]> } {
  type Props = { [K in keyof T]: ReturnType<T[K]> }
  const keys = Object.keys(sources) as (keyof T & string)[]
  const scope = getCurrentScope()
  // Tracked by the element that renders the slot while nothing else makes it render again.
  const firstChange = shallowRef(0)
  let isRead = false

  function onFirstRead() {
    isRead = true
    if (!isClient || (scope && !scope.active))
      return
    const start = () => watch(keys.map(key => sources[key]), () => {
      firstChange.value++
    }, { flush: 'sync', once: true })
    if (scope)
      scope.run(start)
    else
      start()
  }

  return () => {
    const props = {} as Props
    if (isRead) {
      for (const key of keys)
        props[key] = sources[key]() as Props[typeof key]
      return props
    }

    void firstChange.value
    for (const key of keys) {
      let hasValue = false
      let value: Props[typeof key]
      Object.defineProperty(props, key, {
        enumerable: true,
        configurable: true,
        get() {
          if (!hasValue) {
            hasValue = true
            value = sources[key]() as Props[typeof key]
            if (!isRead)
              onFirstRead()
          }
          return value
        },
      })
    }
    return props
  }
}
