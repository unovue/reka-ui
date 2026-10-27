import type { MaybeRefOrGetter, Ref } from 'vue'
import type { StringOrNumber } from '@/shared/types'
import { onScopeDispose, toValue, watch } from 'vue'

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
  function write(key: StringOrNumber, next: string | undefined) {
    if (ids.value.get(key) === next)
      return
    const map = new Map(ids.value)
    if (next)
      map.set(key, next)
    else
      map.delete(key)
    ids.value = map
  }
  watch([() => toValue(value), () => toValue(id)], ([key, next], previous) => {
    const previousKey = previous?.[0]
    if (previousKey !== undefined && previousKey !== key)
      write(previousKey, undefined)
    write(key, next)
  }, { immediate: true })
  onScopeDispose(() => write(toValue(value), undefined))
}
