import type { Ref } from 'vue'
import { nextTick, onBeforeUnmount, onMounted, onScopeDispose, onUnmounted, onUpdated, shallowRef, watch } from 'vue'
import { useCollectionItem } from '@/Collection/Collection'
import { ITEM_DATA_ATTR } from '@/Collection/collectionOrder'
import { useId } from '@/shared'
import { SelectorHold } from '@/shared/createKeyedSelector'
import { injectRovingFocusGroupContext } from './RovingFocusGroup.vue'
import { focusFirst, getFocusIntent, wrapArray } from './utils'

export interface UseRovingFocusItemOptions {
  /** The item's element (`useForwardExpose().currentElement`). */
  element: Ref<HTMLElement | null | undefined>
  /** The tab stop id. Defaults to a generated one. */
  tabStopId?: () => string | undefined
  /** When `false`, arrow keys skip the item and a pointer can't focus it. Defaults to `true`. */
  focusable?: () => boolean | undefined
  /** When `true`, the item is preferred when the group receives focus. */
  active?: () => boolean | undefined
  /** When `true`, Shift + arrow keys still move the focus. */
  allowShiftKey?: () => boolean | undefined
  /** The value the group's `getItems()` reports for the item. */
  value?: () => unknown
}

/**
 * A `RovingFocusGroup` item without its wrapper components. Registers the calling part in the
 * group's collection and returns the attributes and handlers `RovingFocusItem` renders, for the
 * part to bind on its own element.
 *
 * Bind them after the part's `$attrs` and before its own bindings
 * (`mergeProps($attrs, roving.attrs(), own)`), the precedence the wrapper gave them.
 *
 * @internal
 */
export function useRovingFocusItem(options: UseRovingFocusItemOptions) {
  const context = injectRovingFocusGroupContext()
  const randomId = useId()
  const getId = () => options.tabStopId?.() || randomId
  const isFocusable = () => options.focusable?.() ?? true

  // Until a tab stop is chosen, the group only becomes tabbable once its items
  // have mounted, so the server-rendered HTML would have no stop at all. Before
  // mount, the first active item stands in as the stop (one per group, even when
  // several are active, as in a multiple ToggleGroup), or the first focusable one
  // when the group has no active item; after mount the group's own tabindex takes
  // over, as before.
  const isMounted = shallowRef(false)
  const isPreMountTabStop = isFocusable() && context.claimPreMountTabStop(getId(), !!options.active?.())
  // The item holds its id in the group's selector, so it re-renders when it becomes or stops being
  // the tab stop, not whenever the stop moves. Only the stand-in reads `isMounted` and whether a
  // stop exists: the other items have nothing to re-render for once mounted or on the first focus.
  const tabStop = new SelectorHold(context.tabStop)
  onScopeDispose(() => tabStop.release())
  const isCurrentTabStop = () => tabStop.read(getId())
    || (isPreMountTabStop && !context.tabStop.active && !isMounted.value)

  // The group is tabbable while it has a focusable item.
  let counted = false
  const syncFocusable = (focusable: boolean) => {
    if (focusable === counted)
      return
    counted = focusable
    if (focusable)
      context.onFocusableItemAdd()
    else
      context.onFocusableItemRemove()
  }
  onMounted(() => {
    isMounted.value = true
    syncFocusable(isFocusable())
  })
  watch(isFocusable, (focusable) => {
    if (isMounted.value)
      syncFocusable(focusable)
  })
  onUnmounted(() => syncFocusable(false))

  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented)
      return

    if (event.key === 'Tab' && event.shiftKey) {
      context.onItemShiftTab()
      return
    }

    if (event.target !== event.currentTarget)
      return

    const focusIntent = getFocusIntent(
      event,
      context.orientation.value,
      context.dir.value,
    )

    if (focusIntent !== undefined) {
      if (event.metaKey || event.ctrlKey || event.altKey || (options.allowShiftKey?.() ? false : event.shiftKey))
        return
      event.preventDefault()
      let candidateNodes = context.getItems().map(i => i.ref)

      if (focusIntent === 'last') {
        candidateNodes.reverse()
      }
      else if (focusIntent === 'prev' || focusIntent === 'next') {
        if (focusIntent === 'prev')
          candidateNodes.reverse()
        const currentIndex = candidateNodes.indexOf(
          event.currentTarget as HTMLElement,
        )

        candidateNodes = context.loop.value
          ? wrapArray(candidateNodes, currentIndex + 1)
          : candidateNodes.slice(currentIndex + 1)
      }

      nextTick(() => focusFirst(candidateNodes))
    }
  }

  // Bound natively after mount rather than via `@keydown` so it runs after the
  // item's own handlers. An `asChild` item (e.g. a `DropdownMenuTrigger` inside a
  // `ToolbarButton`) or a consumer can then claim a key with `preventDefault()`,
  // matching Radix, where the wrapped child's handler runs first.
  let keydownElement: HTMLElement | undefined
  const bindKeydown = (element: HTMLElement | undefined) => {
    if (element === keydownElement)
      return
    keydownElement?.removeEventListener('keydown', handleKeydown)
    keydownElement = element
    element?.addEventListener('keydown', handleKeydown)
  }
  onBeforeUnmount(() => bindKeydown(undefined))

  // Follows the element like the collection registration does: from the lifecycle hooks, since an
  // effect per item is a queued job per item right after a list mounts.
  const syncKeydown = () => bindKeydown(options.element.value ?? undefined)
  onMounted(syncKeydown)
  onUpdated(syncKeydown)

  useCollectionItem(options.element, () => options.value?.())

  function onMousedown(event: MouseEvent) {
    // We prevent focusing non-focusable items on `mousedown`.
    // Even though the item has tabIndex={-1}, that only means take it out of the tab order.
    if (!isFocusable())
      event.preventDefault()
    // Safari doesn't focus a button when clicked so we run our logic on mousedown also
    else
      context.onItemFocus(getId())
  }

  function onFocus() {
    context.onItemFocus(getId())
  }

  // An `asChild` child can replace its root element without this component
  // re-rendering, which would leave the listener on the detached element. Focus
  // reaches the item before any key does, so rebind from there.
  function onFocusin(event: FocusEvent) {
    bindKeydown(event.currentTarget as HTMLElement)
  }

  return {
    /** The attributes and handlers of the item, read in the part's render. */
    attrs: (): Record<string, unknown> => ({
      [ITEM_DATA_ATTR]: '',
      'tabindex': isCurrentTabStop() ? 0 : -1,
      'data-orientation': context.orientation.value,
      'data-active': options.active?.() ? '' : undefined,
      'data-disabled': !isFocusable() ? '' : undefined,
      onMousedown,
      onFocus,
      onFocusin,
    }),
  }
}
