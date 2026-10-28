import type { ElementSourceLike } from '@/Collection/Collection'
import { getCurrentInstance, getCurrentScope, onBeforeUnmount, onMounted, onScopeDispose, onUpdated } from 'vue'
import { COLLECTION_ITEM_ATTRS, useCollectionItem } from '@/Collection/Collection'
import { SelectorHold } from '@/shared/createKeyedSelector'
import { useId } from '@/shared/useId'
import { injectRovingFocusGroupContext } from './RovingFocusGroup.vue'

export interface UseRovingFocusItemOptions {
  /** The item's element (its `useForwardElement().currentElement`). */
  element: ElementSourceLike
  /** The tab stop id; defaults to a generated one. */
  tabStopId?: () => string | undefined
  /** When `false`, the item is skipped by arrow keys and not focusable by pointer. @defaultValue `true` */
  focusable?: () => boolean | undefined
  /** When `true`, the item is preferred when the group receives focus (`data-active`). */
  active?: () => boolean | undefined
  /** When `true`, Shift + arrow keys still move the focus. */
  allowShiftKey?: () => boolean | undefined
  /** The value the group's `getItems()` reports for this item. */
  value?: () => unknown
}

/**
 * What a roving item registers with its group's collection: the group's
 * delegated keydown reads `allowShiftKey` from it.
 *
 * @internal
 */
export interface RovingFocusItemMeta {
  readonly roving: true
  allowShiftKey: () => boolean
}

const noShiftKey = () => false

/**
 * A `RovingFocusGroup` item, as a composable: registers the part with the
 * group's collection and returns the attrs to bind on the part's own element
 * (`tabindex`, `data-orientation`, `data-active`, `data-disabled`, the
 * collection marker and the focus handlers). Arrow keys are handled by the
 * group (one delegated listener), so the item holds no listener and no
 * watcher; its `tabindex` reads a keyed selector, so moving the tab stop
 * re-renders only the old and the new item.
 *
 * Bind the attrs BEFORE the part's own attrs (`mergeProps(roving.attrs(), own)`),
 * which is the precedence the `RovingFocusItem` wrapper had.
 *
 * Returns `null` outside a `RovingFocusGroup`.
 *
 * @internal
 * @lifecycle setup
 */
export function useRovingFocusItem(options: UseRovingFocusItemOptions) {
  const context = injectRovingFocusGroupContext(null)
  if (!context)
    return null

  const randomId = useId()
  const getId = () => options.tabStopId?.() || randomId
  const isFocusable = () => options.focusable?.() ?? true

  const meta: RovingFocusItemMeta = {
    roving: true,
    allowShiftKey: options.allowShiftKey ? () => !!options.allowShiftKey!() : noShiftKey,
  }
  useCollectionItem(options.element, options.value, { meta })

  // The group's tabbable state counts the focusable items. Counted from setup
  // and re-synced on render, instead of a watcher per item.
  let counted = isFocusable()
  if (counted)
    context.onFocusableItemAdd()

  const tabStop = new SelectorHold(context.tabStop)
  if (getCurrentScope()) {
    onScopeDispose(() => {
      tabStop.release()
      if (counted)
        context.onFocusableItemRemove()
    })
  }

  // An item rendered outside the group's element (through a `Teleport`): its
  // keydown never bubbles to the group's listener, so it listens itself.
  if (getCurrentInstance()) {
    let detached: Element | undefined
    const listener = context.onDetachedItemKeydown as EventListener
    // Re-synced after each render too: an `asChild` item can swap its element.
    const syncDetached = () => {
      const element = options.element.value as Element | null | undefined
      const root = context.rootElement.value as Element | null | undefined
      const next = element && root && !root.contains(element) ? element : undefined
      if (next === detached)
        return
      detached?.removeEventListener('keydown', listener)
      detached = next
      detached?.addEventListener('keydown', listener)
    }
    onMounted(syncDetached)
    onUpdated(syncDetached)
    onBeforeUnmount(() => {
      detached?.removeEventListener('keydown', listener)
      detached = undefined
    })
  }

  function onMousedown(event: MouseEvent) {
    // We prevent focusing non-focusable items on `mousedown`.
    // Even though the item has tabIndex={-1}, that only means take it out of the tab order.
    if (!isFocusable())
      event.preventDefault()
    // Safari doesn't focus a button when clicked so we run our logic on mousedown also
    else
      context!.onItemFocus(getId())
  }

  function onFocus() {
    context!.onItemFocus(getId())
  }

  return {
    id: getId,
    attrs: (): Record<string, unknown> => {
      const focusable = isFocusable()
      if (focusable !== counted) {
        counted = focusable
        if (focusable)
          context.onFocusableItemAdd()
        else
          context.onFocusableItemRemove()
      }
      return {
        // First, where the `CollectionItem` wrapper put it.
        ...COLLECTION_ITEM_ATTRS,
        'tabindex': tabStop.read(getId()) ? 0 : -1,
        'data-orientation': context.orientation.value,
        'data-active': options.active?.() ? '' : undefined,
        'data-disabled': !focusable ? '' : undefined,
        onMousedown,
        onFocus,
      }
    },
  }
}

export type UseRovingFocusItemReturn = NonNullable<ReturnType<typeof useRovingFocusItem>>
