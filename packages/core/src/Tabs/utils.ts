import type { MaybeRefOrGetter, Ref } from 'vue'
import type { StringOrNumber } from '@/shared/types'
import { getCurrentInstance, onBeforeUpdate, onMounted, onScopeDispose, shallowRef, toValue, watch } from 'vue'
import { rendersForeignId } from '@/shared/usePartId'

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
 * The id a part's element kept from the server render when it differs from the
 * one the client generated (the ids diverge when something else consumed ids
 * before the tabs on one side only). Hydration keeps the server's attribute, so
 * the paired part's reference has to follow the element, not the client id. The
 * same goes for an `id` on an `asChild` part's child. `undefined` for a part that
 * can only render its own id. Pass it to `useTabsPartId` after the consumer `id`.
 *
 * @lifecycle setup
 */
export function useHydratedId(element: Readonly<Ref<HTMLElement | null>>, generated: () => string | undefined): Readonly<Ref<string | undefined>> | undefined {
  // Only a part that may render an id other than its own does: a hydrating one (the server's),
  // or an `asChild` one (its child's). See `rendersForeignId`.
  if (!getCurrentInstance() || !rendersForeignId())
    return undefined
  const id = shallowRef<string>()
  onMounted(() => {
    const rendered = element.value?.id
    if (rendered && rendered !== generated())
      id.value = rendered
  })
  return id
}

/**
 * Keeps a part's `id` prop in the Root's by-value id map (`customTriggerIds` /
 * `customContentIds`), so the paired part's `aria-labelledby` / `aria-controls`
 * follows it (the consumer's id wins). Follows `value` and `id`
 * changes and drops the entry on unmount.
 *
 * Pass `propsOnly` when `value` and `id` read nothing but the part's own props:
 * a new prop value always re-renders the part, so the entry is then checked
 * before each update instead of by a watcher of its own.
 *
 * @lifecycle setup
 */
export function useTabsPartId(
  ids: Ref<Map<StringOrNumber, string>>,
  value: MaybeRefOrGetter<StringOrNumber>,
  id: MaybeRefOrGetter<string | undefined>,
  propsOnly = false,
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

  function sync(key: StringOrNumber, next: string | undefined) {
    // `registered &&`, not `registered?.key`: an undefined `value` would match the missing entry.
    if (registered && registered.key === key && registered.id === next)
      return
    release()
    registered = undefined
    if (!next)
      return
    if (ids.value.get(key) !== next)
      ids.value = new Map(ids.value).set(key, next)
    registered = { key, id: next }
  }

  if (propsOnly && getCurrentInstance()) {
    const check = () => sync(toValue(value), toValue(id))
    check()
    onBeforeUpdate(check)
  }
  else {
    watch([() => toValue(value), () => toValue(id)], ([key, next]) => sync(key, next), { immediate: true })
  }
  onScopeDispose(release)
}
