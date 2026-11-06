import type { MaybeRefOrGetter, Ref } from 'vue'
import type { StringOrNumber } from '@/shared/types'
import { getCurrentInstance, onScopeDispose, toValue, watch } from 'vue'

/**
 * Whether the current component renders inside a `KeepAlive`, so that it can
 * be deactivated (Vue walks the same parent chain for `onDeactivated`).
 *
 * @lifecycle setup
 */
export function isInsideKeepAlive(): boolean {
  let parent = getCurrentInstance()?.parent
  while (parent) {
    if ((parent.type as { __isKeepAlive?: boolean }).__isKeepAlive)
      return true
    parent = parent.parent
  }
  return false
}

export function makeTriggerId(baseId: string, value: StringOrNumber) {
  return `${baseId}-trigger-${value}`
}

export function makeContentId(baseId: string, value: StringOrNumber) {
  return `${baseId}-content-${value}`
}

/**
 * Keeps a part's `id` prop in the Root's by-value id map (`customTriggerIds` /
 * `customContentIds`), so the paired part's `aria-labelledby` / `aria-controls`
 * follows it (Base UI parity: the consumer's id wins). Follows `value` and `id`
 * changes and drops the entry on unmount.
 *
 * @lifecycle setup
 */
export function useTabsPartId(
  ids: Ref<Map<StringOrNumber, string>>,
  value: MaybeRefOrGetter<StringOrNumber>,
  id: MaybeRefOrGetter<string | undefined>,
) {
  // The entry this part wrote. It is only removed while the map still holds it:
  // when two parts swap `value`s in one update, the other part may already have
  // written its id under this part's previous value.
  let registered: { key: StringOrNumber, id: string } | undefined

  function release() {
    if (!registered || ids.value.get(registered.key) !== registered.id)
      return
    const map = new Map(ids.value)
    map.delete(registered.key)
    ids.value = map
  }

  watch([() => toValue(value), () => toValue(id)], ([key, next]) => {
    if (registered?.key === key && registered.id === next)
      return
    release()
    registered = undefined
    if (!next)
      return
    if (ids.value.get(key) !== next)
      ids.value = new Map(ids.value).set(key, next)
    registered = { key, id: next }
  }, { immediate: true })
  onScopeDispose(release)
}
