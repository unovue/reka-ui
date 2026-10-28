import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { camelize, computed, getCurrentInstance, toValue } from 'vue'

interface PropOptions {
  type?: any
  required?: boolean
  default?: any
}

/**
 * Vue coerces optional boolean props (e.g. `foo?: boolean`) to non-optional (`foo: boolean`)
 * in the `defineProps` return type. Since `useForwardProps` only returns props that were
 * explicitly assigned, boolean-typed props should remain optional in the return type.
 */
export type WithOptionalBooleans<T> = {
  [K in keyof T as [T[K]] extends [boolean] ? K : never]?: T[K]
} & {
  [K in keyof T as [T[K]] extends [boolean] ? never : K]: T[K]
}

/** The declared props that have a default, per component definition (built once, not per instance). */
const defaultedKeys = new WeakMap<object, { source: unknown, keys: string[] }>()

function getDefaultedKeys(type: { props?: Record<string, unknown> } | undefined): string[] {
  if (!type)
    return []
  const source = type.props
  let cached = defaultedKeys.get(type)
  // Keyed on the `props` option too: HMR patches a definition in place with a new one.
  if (!cached || cached.source !== source) {
    const props = source ?? {}
    cached = { source, keys: Object.keys(props).filter(key => (props[key] as PropOptions | null)?.default !== undefined) }
    defaultedKeys.set(type, cached)
  }
  return cached.keys
}

/**
 * The `useForwardProps` function in TypeScript takes in a set of props and returns a computed value
 * that combines default props with assigned props from the current instance.
 * @param {T} props - The `props` parameter is an object that represents the props passed to a
 * component.
 * @returns computed value that combines the default props, preserved props, and assigned props.
 */
export function useForwardProps<T extends Record<string, any>>(props: MaybeRefOrGetter<T>): ComputedRef<WithOptionalBooleans<T>> {
  const vm = getCurrentInstance()
  // Declared props with a default always forward (when the source holds them).
  const defaults = getDefaultedKeys(vm?.type as { props?: Record<string, unknown> } | undefined)

  return computed(() => {
    const source = toValue(props)
    const out = {} as Record<string, any>
    for (const key of defaults) {
      if (source[key] !== undefined)
        out[key] = source[key]
    }
    // Then the props the parent assigned (only values the source holds).
    const assigned = vm?.vnode.props
    for (const raw in assigned) {
      const key = camelize(raw)
      if (source[key] !== undefined)
        out[key] = source[key]
    }
    return out as WithOptionalBooleans<T>
  })
}
