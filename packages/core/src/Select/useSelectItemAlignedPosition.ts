import type { Ref } from 'vue'
import type { SelectContentContext } from './SelectContentImpl.vue'
import type { SelectRootContext } from './SelectRoot.vue'
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { clamp, createContext } from '@/shared'
import { CONTENT_MARGIN } from './utils'

interface SelectItemAlignedPositionContext {
  contentWrapper?: Ref<HTMLElement | undefined>
  shouldExpandOnScrollRef?: Ref<boolean>
  onScrollButtonChange: (node: HTMLElement | undefined) => void
}

export const [injectSelectItemAlignedPositionContext, provideSelectItemAlignedPositionContext]
  = createContext<SelectItemAlignedPositionContext>('SelectItemAlignedPosition')

export interface UseSelectItemAlignedPositionOptions {
  rootContext: SelectRootContext<any>
  contentContext: SelectContentContext
  /** The content element (the `role="listbox"` element). */
  contentElement: Readonly<Ref<HTMLElement | null | undefined>>
  getItems: () => Array<{ ref: HTMLElement }>
  /** Whether the content is item-aligned now (its `position`). */
  enabled: () => boolean
  /** Called each time the content has been positioned. */
  onPlaced: () => void
}

/**
 * The `item-aligned` position, as a composable: the content renders its own
 * fixed wrapper (bound to `wrapper`, with `zIndex` copied from the content)
 * and this places it so the selected item's text sits over the trigger's
 * value, like a native macOS menu. It was `SelectItemAlignedPosition`, a
 * component between the content and its element.
 *
 * @internal
 * @lifecycle setup
 */
export function useSelectItemAlignedPosition(options: UseSelectItemAlignedPositionOptions) {
  const { rootContext, contentContext, contentElement, getItems } = options

  const shouldExpandOnScrollRef = ref(false)
  const shouldRepositionRef = ref(true)

  const contentWrapperElement = ref<HTMLElement>()

  const { viewport, selectedItem, selectedItemText, focusSelectedItem }
    = contentContext

  /**
   * The untransformed offset of `element`'s border box from the layout root
   * (the sum of its `offsetLeft`s and of its offset parents' left borders).
   * Layout offsets ignore transforms, so the content measures the same while a
   * `scale()` starting style or enter animation is applied (#2827).
   */
  function getLayoutLeft(element: HTMLElement) {
    let left = 0
    let node: HTMLElement | null = element
    while (node) {
      left += node.offsetLeft
      const parent = node.offsetParent as HTMLElement | null
      if (parent)
        left += parent.clientLeft
      node = parent
    }
    return left
  }

  function position() {
    if (
      rootContext.triggerElement.value
      && rootContext.valueElement.value
      && contentWrapperElement.value
      && contentElement.value
      && viewport?.value
      && selectedItem?.value
      && selectedItemText?.value
    ) {
      const triggerRect = rootContext.triggerElement.value.getBoundingClientRect()

      // -----------------------------------------------------------------------------------------
      //  Horizontal positioning
      // -----------------------------------------------------------------------------------------
      // The content's own metrics come from layout, not from its (possibly
      // transformed) bounding rect.
      const contentLayoutWidth = contentElement.value.offsetWidth
      const valueNodeRect = rootContext.valueElement.value.getBoundingClientRect()
      const itemTextLeft = getLayoutLeft(selectedItemText.value) - getLayoutLeft(contentElement.value)
      const itemTextRight = itemTextLeft + selectedItemText.value.offsetWidth

      if (rootContext.dir.value !== 'rtl') {
        const itemTextOffset = itemTextLeft
        const left = valueNodeRect.left - itemTextOffset
        const leftDelta = triggerRect.left - left
        const minContentWidth = triggerRect.width + leftDelta
        const contentWidth = Math.max(minContentWidth, contentLayoutWidth)
        const rightEdge = window.innerWidth - CONTENT_MARGIN
        const clampedLeft = clamp(left, CONTENT_MARGIN, Math.max(CONTENT_MARGIN, rightEdge - contentWidth))

        contentWrapperElement.value.style.minWidth = `${minContentWidth}px`
        contentWrapperElement.value.style.left = `${clampedLeft}px`
      }
      else {
        const itemTextOffset = contentLayoutWidth - itemTextRight
        const right = window.innerWidth - valueNodeRect.right - itemTextOffset
        const rightDelta = window.innerWidth - triggerRect.right - right
        const minContentWidth = triggerRect.width + rightDelta
        const contentWidth = Math.max(minContentWidth, contentLayoutWidth)
        const leftEdge = window.innerWidth - CONTENT_MARGIN
        const clampedRight = clamp(
          right,
          CONTENT_MARGIN,
          Math.max(CONTENT_MARGIN, leftEdge - contentWidth),
        )

        contentWrapperElement.value.style.minWidth = `${minContentWidth}px`
        contentWrapperElement.value.style.right = `${clampedRight}px`
      }

      // -----------------------------------------------------------------------------------------
      // Vertical positioning
      // -----------------------------------------------------------------------------------------
      const items = getItems().map(i => i.ref)
      const availableHeight = window.innerHeight - CONTENT_MARGIN * 2
      const itemsHeight = viewport.value.scrollHeight

      const contentStyles = window.getComputedStyle(contentElement.value)
      const contentBorderTopWidth = Number.parseInt(
        contentStyles.borderTopWidth,
        10,
      )
      const contentPaddingTop = Number.parseInt(contentStyles.paddingTop, 10)
      const contentBorderBottomWidth = Number.parseInt(
        contentStyles.borderBottomWidth,
        10,
      )
      const contentPaddingBottom = Number.parseInt(
        contentStyles.paddingBottom,
        10,
      )

      const fullContentHeight = contentBorderTopWidth + contentPaddingTop + itemsHeight + contentPaddingBottom + contentBorderBottomWidth
      const minContentHeight = Math.min(
        selectedItem.value.offsetHeight * 5,
        fullContentHeight,
      )

      const viewportStyles = window.getComputedStyle(viewport.value)
      const viewportPaddingTop = Number.parseInt(viewportStyles.paddingTop, 10)
      const viewportPaddingBottom = Number.parseInt(
        viewportStyles.paddingBottom,
        10,
      )

      const topEdgeToTriggerMiddle
        = triggerRect.top + triggerRect.height / 2 - CONTENT_MARGIN
      const triggerMiddleToBottomEdge = availableHeight - topEdgeToTriggerMiddle

      const selectedItemHalfHeight = selectedItem.value.offsetHeight / 2
      const itemOffsetMiddle
        = selectedItem.value.offsetTop + selectedItemHalfHeight
      const contentTopToItemMiddle
        = contentBorderTopWidth + contentPaddingTop + itemOffsetMiddle
      const itemMiddleToContentBottom
        = fullContentHeight - contentTopToItemMiddle

      const willAlignWithoutTopOverflow
        = contentTopToItemMiddle <= topEdgeToTriggerMiddle

      if (willAlignWithoutTopOverflow) {
        const isLastItem = selectedItem.value === items.at(-1)
        contentWrapperElement.value.style.bottom = `${0}px`
        const viewportOffsetBottom
          = contentElement.value.clientHeight
            - viewport.value.offsetTop
            - viewport.value.offsetHeight
        const clampedTriggerMiddleToBottomEdge = Math.max(
          triggerMiddleToBottomEdge,
          selectedItemHalfHeight
          // viewport might have padding bottom, include it to avoid a scrollable viewport
          + (isLastItem ? viewportPaddingBottom : 0)
          + viewportOffsetBottom
          + contentBorderBottomWidth,
        )
        const height = contentTopToItemMiddle + clampedTriggerMiddleToBottomEdge
        contentWrapperElement.value.style.height = `${height}px`
      }
      else {
        const isFirstItem = selectedItem.value === items[0]
        contentWrapperElement.value.style.top = `${0}px`
        const clampedTopEdgeToTriggerMiddle = Math.max(
          topEdgeToTriggerMiddle,
          contentBorderTopWidth
          + viewport.value.offsetTop
          // viewport might have padding top, include it to avoid a scrollable viewport
          + (isFirstItem ? viewportPaddingTop : 0)
          + selectedItemHalfHeight,
        )
        const height = clampedTopEdgeToTriggerMiddle + itemMiddleToContentBottom
        contentWrapperElement.value.style.height = `${height}px`
        viewport.value.scrollTop
          = contentTopToItemMiddle
            - topEdgeToTriggerMiddle
            + viewport.value.offsetTop
      }

      contentWrapperElement.value.style.margin = `${CONTENT_MARGIN}px 0`
      contentWrapperElement.value.style.minHeight = `${minContentHeight}px`
      contentWrapperElement.value.style.maxHeight = `${availableHeight}px`
      // -----------------------------------------------------------------------------------------

      options.onPlaced()

      // we don't want the initial scroll position adjustment to trigger "expand on scroll"
      // so we explicitly turn it on only after they've registered.
      requestAnimationFrame(() => (shouldExpandOnScrollRef.value = true))
    }
  }

  // copy z-index from content to wrapper
  const contentZIndex = ref('')

  // Positions once the wrapper is rendered: on mount, as the component did
  // from its `onMounted`, or when `position` switches to item-aligned.
  watch(contentWrapperElement, async (wrapper) => {
    if (!wrapper)
      return
    await nextTick()
    position()
    if (contentElement.value)
      contentZIndex.value = window.getComputedStyle(contentElement.value).zIndex
  }, { flush: 'post' })

  // When the viewport becomes scrollable at the top, the scroll up button will mount.
  // Because it is part of the normal flow, it will push down the viewport, thus throwing our
  // trigger => selectedItem alignment off by the amount the viewport was pushed down.
  // We wait for this to happen and then re-run the positining logic one more time to account for it.
  function handleScrollButtonChange(node: HTMLElement | undefined) {
    if (node && shouldRepositionRef.value === true) {
      position()
      focusSelectedItem?.()
      shouldRepositionRef.value = false
    }
  }

  // Resize and position when trigger element changes
  useResizeObserver(computed(() => options.enabled() ? rootContext.triggerElement.value : undefined), () => {
    position()
  })

  provideSelectItemAlignedPositionContext({
    contentWrapper: contentWrapperElement,
    shouldExpandOnScrollRef,
    onScrollButtonChange: handleScrollButtonChange,
  })

  return {
    /** The fixed wrapper around the content element. */
    wrapper: contentWrapperElement,
    /** The content's computed `z-index`, for the wrapper. */
    zIndex: contentZIndex,
  }
}
