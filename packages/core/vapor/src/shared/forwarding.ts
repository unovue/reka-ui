// Vapor-safe versions of the getCurrentInstance-based forwarding composables.
// Each file below is swapped in for its `src/shared/*` counterpart by `vapor/vite.config.mjs`.
import type { MaybeRefOrGetter } from 'vue'
import { camelize, computed, toHandlerKey, toRef } from 'vue'
import { getGenericInstance, instanceEmits, instancePropOptions, instanceScopeId, passedPropKeys } from './internals'

/** v2 reads `vnode.scopeId`; a Vapor instance carries the same id as `instance.scopeId`. */
export function useForwardScopeId(): Record<string, string> {
  const scopeId = instanceScopeId(getGenericInstance())
  return scopeId ? { [scopeId]: '' } : {}
}

/**
 * v2 reads `vm.vnode.props` to know which props the parent passed. A Vapor instance has no vnode;
 * `rawKeys()` lists the keys of its raw props (static and dynamic sources).
 */
export function useForwardProps<T extends Record<string, any>>(props: MaybeRefOrGetter<T>) {
  const vm = getGenericInstance()
  const options = instancePropOptions(vm)
  const defaults = Object.keys(options).filter(k => options[k]?.default !== undefined)
  const refProps = toRef(props)
  return computed(() => {
    const assigned = passedPropKeys(vm)
    const keys = new Set([...defaults, ...assigned.map(k => camelize(k))])
    const out: Record<string, any> = {}
    keys.forEach((k) => {
      if (refProps.value[k] !== undefined)
        out[k] = refProps.value[k]
    })
    return out as T
  })
}

export function useEmitAsProps(emit: (name: any, ...args: any[]) => void) {
  const events = instanceEmits(getGenericInstance())
  const result: Record<string, any> = {}
  events.forEach((ev) => {
    result[toHandlerKey(camelize(ev))] = (...arg: any[]) => emit(ev, ...arg)
  })
  return result
}
