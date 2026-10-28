import { getCurrentInstance, queuePostFlushCb, shallowRef } from 'vue'

/**
 * Keeps a part's `Presence` mounted only while it is shown or its exit runs:
 * a part that is not shown mounts no `Presence` (Base UI's
 * `SelectItemIndicator` returns `null`). One shown after the part mounted
 * enters with `data-starting-style`, as it did while `Presence` was always
 * mounted.
 *
 * ```vue
 * <Presence
 *   v-if="lingering.mounted()"
 *   :present="shown"
 *   :appear="lingering.appear()"
 *   @vue:mounted="lingering.onMounted"
 *   @complete="lingering.onComplete"
 * >
 * ```
 *
 * An exit's `complete(false)` can arrive while the part is being shown again:
 * re-selected from an `after-leave` handler, or through a `v-model` whose prop
 * only updates on the next render. So the unmount decision waits until the
 * current flush has settled, then re-reads `present`: the `Presence` is
 * dropped only if the part is still hidden, and otherwise stays armed so the
 * next hide runs its exit.
 *
 * @internal
 * @lifecycle setup
 */
export function useLingeringPresence(present: () => boolean) {
  const instance = getCurrentInstance()
  const lingering = shallowRef(false)
  let pending = false

  function settle() {
    pending = false
    if (!present())
      lingering.value = false
  }

  return {
    /** Whether the `Presence` is rendered: shown, or still finishing its exit. */
    mounted: () => present() || lingering.value,
    /** `appear` for the `Presence`: only one shown after the part mounted enters. */
    appear: () => !!instance?.isMounted,
    /** Bind to the `Presence`'s `@vue:mounted`. */
    onMounted: () => {
      lingering.value = true
    },
    /** Bind to the `Presence`'s `@complete`. */
    onComplete: (shown: boolean) => {
      if (shown || pending)
        return
      pending = true
      queuePostFlushCb(settle)
    },
  }
}

export type UseLingeringPresenceReturn = ReturnType<typeof useLingeringPresence>
