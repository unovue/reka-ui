<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

const paintContainmentRE = /(?:^|\s)(?:paint|strict|content)(?:\s|$)/
const whitespaceRE = /\s+/

export interface NavigationMenuViewportProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
  /**
   * Placement of the viewport for css variables `(--reka-navigation-menu-viewport-left, --reka-navigation-menu-viewport-top)`.
   * @defaultValue 'center'
   */
  align?: 'start' | 'center' | 'end'
  /**
   * When `true`, keeps the viewport inside the ancestors that clip it (an `overflow` other
   * than `visible`, or paint containment) instead of the document, and sets the position
   * css variables in the coordinates of the viewport's containing block.
   * @defaultValue false
   */
  avoidClipping?: boolean
}
</script>

<script setup lang="ts">
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { Presence } from '@/Presence'
import {
  Primitive,
} from '@/Primitive'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { getOpenState, whenMouse } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NavigationMenuViewportProps>(), {
  align: 'center',
})

const { forwardRef, currentElement } = useForwardExpose()

const menuContext = injectNavigationMenuContext()
const { activeTrigger, rootNavigationMenu, modelValue } = menuContext

const size = ref<{ width: number, height: number }>()
const position = ref<{ left: number, top: number }>()
let rootSize: { target: Element, width: number, height: number } | undefined

interface ClippingAncestor {
  element: HTMLElement
  clipX: boolean
  clipY: boolean
}

function generatesClippingBox(style: CSSStyleDeclaration) {
  const display = style.display
  const nonAtomicInline = display === 'inline' || display === 'inline flow' || display.startsWith('ruby')
  return display !== 'none' && display !== 'contents' && !nonAtomicInline
}

function getClippingAncestors(element: Element): ClippingAncestor[] {
  const ancestors: ClippingAncestor[] = []
  const containingBlock = element instanceof HTMLElement ? element.offsetParent : null
  let betweenContainingBlock = true

  for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor)
    if (!generatesClippingBox(style))
      continue

    const paintContainment = paintContainmentRE.test(style.contain)
    const clipX = paintContainment || style.overflowX !== 'visible'
    const clipY = paintContainment || style.overflowY !== 'visible'

    // Overflow does not clip an absolutely positioned descendant between the
    // descendant and its containing block. Paint containment still clips and
    // establishes the relevant containing block itself.
    if ((paintContainment || ancestor === containingBlock || !betweenContainingBlock) && (clipX || clipY))
      ancestors.push({ element: ancestor, clipX, clipY })

    if (ancestor === containingBlock)
      betweenContainingBlock = false
  }

  return ancestors
}

function getClippingRect(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const scaleX = element.offsetWidth ? rect.width / element.offsetWidth : 1
  const scaleY = element.offsetHeight ? rect.height / element.offsetHeight : 1

  // Overflow and paint containment clip at the padding edge. The client box
  // also excludes a scrollbar, while the rect is the transformed border box.
  return {
    left: rect.left + element.clientLeft * scaleX,
    top: rect.top + element.clientTop * scaleY,
    right: rect.left + (element.clientLeft + element.clientWidth) * scaleX,
    bottom: rect.top + (element.clientTop + element.clientHeight) * scaleY,
  }
}

function getClippingBoundary(element: Element) {
  const boundary = {
    left: 0,
    top: 0,
    right: document.documentElement.offsetWidth,
    bottom: document.documentElement.offsetHeight,
  }

  for (const { element: ancestor, clipX, clipY } of getClippingAncestors(element)) {
    const rect = getClippingRect(ancestor)

    if (clipX) {
      boundary.left = Math.max(boundary.left, rect.left)
      boundary.right = Math.min(boundary.right, rect.right)
    }
    if (clipY) {
      boundary.top = Math.max(boundary.top, rect.top)
      boundary.bottom = Math.min(boundary.bottom, rect.bottom)
    }
  }

  return boundary
}

function establishesContainingBlock(element: HTMLElement) {
  const style = getComputedStyle(element)
  const containment = style.contain.split(whitespaceRE)
  const willChange = style.willChange.split(',').map(value => value.trim())
  return style.position !== 'static'
    || style.transform !== 'none'
    || style.perspective !== 'none'
    || style.filter !== 'none'
    || containment.includes('layout')
    || containment.includes('paint')
    || containment.includes('strict')
    || containment.includes('content')
    || willChange.includes('transform')
    || willChange.includes('perspective')
    || willChange.includes('filter')
}

function getPositioningContext(element: HTMLElement, fallbackScaleX: number, fallbackScaleY: number, preferredContainingBlock?: HTMLElement) {
  const offsetParent = element.offsetParent as HTMLElement | null
  // Browsers return body as offsetParent for some absolutely positioned
  // elements even when it is only the fallback for the initial containing
  // block. Its margin must not become part of the positioning origin then.
  const containingBlock = offsetParent && (offsetParent !== document.body || establishesContainingBlock(offsetParent))
    ? offsetParent
    : null
  if (containingBlock) {
    const rect = containingBlock.getBoundingClientRect()
    const scaleX = containingBlock === preferredContainingBlock
      ? fallbackScaleX
      : containingBlock.offsetWidth ? rect.width / containingBlock.offsetWidth : fallbackScaleX
    const scaleY = containingBlock === preferredContainingBlock
      ? fallbackScaleY
      : containingBlock.offsetHeight ? rect.height / containingBlock.offsetHeight : fallbackScaleY

    return {
      left: rect.left + (containingBlock.clientLeft - containingBlock.scrollLeft) * scaleX,
      top: rect.top + (containingBlock.clientTop - containingBlock.scrollTop) * scaleY,
      scaleX,
      scaleY,
    }
  }

  // A fixed element is positioned from the viewport. An absolute element
  // without an offset parent is positioned from the initial containing block.
  const fixed = getComputedStyle(element).position === 'fixed'
  return {
    left: fixed ? 0 : -window.scrollX,
    top: fixed ? 0 : -window.scrollY,
    scaleX: 1,
    scaleY: 1,
  }
}

const content = ref<HTMLElement>()
const open = computed(() => !!menuContext.modelValue.value)
const clippingAncestors = computed(() => props.avoidClipping && currentElement.value && content.value && open.value
  ? getClippingAncestors(currentElement.value).map(({ element }) => element)
  : [])

watch(currentElement, () => {
  menuContext.onViewportChange(currentElement.value)
})

watch([modelValue, open], () => {
  nextTick(() => {
    if (!currentElement.value)
      return

    requestAnimationFrame(() => {
      const el = (currentElement.value as HTMLElement)?.querySelector('[data-state=open]') as HTMLElement | undefined
      content.value = el
    })
  })
}, { immediate: true })

function updatePosition() {
  if (props.avoidClipping)
    updateClippedPosition()
  else
    updateDocumentPosition()
}

/** Clamps against the document, in the root's coordinates. */
function updateDocumentPosition() {
  if (content.value && activeTrigger.value && rootNavigationMenu.value) {
    const bodyWidth = document.documentElement.offsetWidth
    const bodyHeight = document.documentElement.offsetHeight
    const rootRect = rootNavigationMenu.value.getBoundingClientRect()
    // Rectangles include transforms; ResizeObserver border boxes retain the
    // fractional, untransformed layout size (unlike offsetWidth/offsetHeight).
    // A root without a box on an axis (`display: contents`, zero width or height) is
    // never measured, or measures 0: there is no scale to read, so assume none.
    const layoutSize = rootSize?.target === rootNavigationMenu.value ? rootSize : undefined
    const scaleX = (layoutSize?.width && rootRect.width / layoutSize.width) || 1
    const scaleY = (layoutSize?.height && rootRect.height / layoutSize.height) || 1
    const rect = activeTrigger.value.getBoundingClientRect()
    const { offsetWidth, offsetHeight } = content.value

    // Find the beginning of the position of the menu item
    const startPositionLeft = (rect.left - rootRect.left) / scaleX
    const startPositionTop = (rect.top - rootRect.top) / scaleY

    // Aligning to specified alignment
    let posLeft = null
    let posTop = null
    switch (props.align) {
      case 'start':
        posLeft = startPositionLeft
        posTop = startPositionTop
        break
      case 'end':
        posLeft = startPositionLeft - offsetWidth + rect.width / scaleX
        posTop = startPositionTop - offsetHeight + rect.height / scaleY
        break
      default:
        // center
        posLeft = startPositionLeft - offsetWidth / 2 + rect.width / scaleX / 2
        posTop = startPositionTop - offsetHeight / 2 + rect.height / scaleY / 2
    }

    const screenOffset = 10

    // Convert the screen bounds to local coordinates before clamping.
    const minLeft = (screenOffset - rootRect.left) / scaleX
    const maxLeft = (bodyWidth - screenOffset - rootRect.left) / scaleX - offsetWidth
    const minTop = (screenOffset - rootRect.top) / scaleY
    const maxTop = (bodyHeight - screenOffset - rootRect.top) / scaleY - offsetHeight
    posLeft = Math.max(minLeft, Math.min(posLeft, maxLeft))
    posTop = Math.max(minTop, Math.min(posTop, maxTop))

    // Possible blurring font with decimal values
    posLeft = Math.round(posLeft)
    posTop = Math.round(posTop)

    position.value = {
      left: posLeft,
      top: posTop,
    }
  }
}

/** Clamps against the clipping ancestors, in the coordinates of the viewport's containing block. */
function updateClippedPosition() {
  if (content.value && activeTrigger.value && rootNavigationMenu.value && currentElement.value) {
    const rootRect = rootNavigationMenu.value.getBoundingClientRect()
    // Rectangles include transforms; ResizeObserver border boxes retain the
    // fractional, untransformed layout size (unlike offsetWidth/offsetHeight).
    // A root without a box on an axis (`display: contents`, zero width or height) is
    // never measured, or measures 0: there is no scale to read, so assume none.
    const layoutSize = rootSize?.target === rootNavigationMenu.value ? rootSize : undefined
    const scaleX = (layoutSize?.width && rootRect.width / layoutSize.width) || 1
    const scaleY = (layoutSize?.height && rootRect.height / layoutSize.height) || 1
    const rect = activeTrigger.value.getBoundingClientRect()
    const { offsetWidth, offsetHeight } = content.value

    const positioningContext = getPositioningContext(currentElement.value, scaleX, scaleY, rootNavigationMenu.value)
    const renderedWidth = offsetWidth * positioningContext.scaleX
    const renderedHeight = offsetHeight * positioningContext.scaleY

    // Align against the rendered viewport size in screen coordinates. The
    // root and the viewport's containing block can have different scales.
    let screenLeft = 0
    let screenTop = 0
    switch (props.align) {
      case 'start':
        screenLeft = rect.left
        screenTop = rect.top
        break
      case 'end':
        screenLeft = rect.right - renderedWidth
        screenTop = rect.bottom - renderedHeight
        break
      default:
        // center
        screenLeft = rect.left + (rect.width - renderedWidth) / 2
        screenTop = rect.top + (rect.height - renderedHeight) / 2
    }

    const screenOffset = 10
    const clippingBoundary = getClippingBoundary(currentElement.value)
    const clampedScreenLeft = Math.max(
      clippingBoundary.left + screenOffset,
      Math.min(screenLeft, clippingBoundary.right - screenOffset - renderedWidth),
    )
    const clampedScreenTop = Math.max(
      clippingBoundary.top + screenOffset,
      Math.min(screenTop, clippingBoundary.bottom - screenOffset - renderedHeight),
    )
    let posLeft = (clampedScreenLeft - positioningContext.left) / positioningContext.scaleX
    let posTop = (clampedScreenTop - positioningContext.top) / positioningContext.scaleY

    // Possible blurring font with decimal values
    posLeft = Math.round(posLeft)
    posTop = Math.round(posTop)

    position.value = {
      left: posLeft,
      top: posTop,
    }
  }
}

useResizeObserver(content, () => {
  if (content.value) {
    size.value = {
      width: content.value.offsetWidth,
      height: content.value.offsetHeight,
    }
    updatePosition()
  }
})

useResizeObserver([globalThis.document?.body, rootNavigationMenu], (entries) => {
  const entry = entries.find(entry => entry.target === rootNavigationMenu.value)
  if (entry) {
    const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize
    const style = getComputedStyle(entry.target)
    // ResizeObserver sizes use logical axes, whereas client rects use physical axes.
    const vertical = style.writingMode.startsWith('vertical') || style.writingMode.startsWith('sideways')
    // Older observers may omit borderBoxSize. Resolved CSS dimensions also
    // retain fractions; include padding and borders for a content-box root.
    const extraWidth = style.boxSizing === 'border-box'
      ? 0
      : Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight) + Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth)
    const extraHeight = style.boxSizing === 'border-box'
      ? 0
      : Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) + Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
    rootSize = {
      target: entry.target,
      width: borderBox ? (vertical ? borderBox.blockSize : borderBox.inlineSize) : Number.parseFloat(style.width) + extraWidth,
      height: borderBox ? (vertical ? borderBox.inlineSize : borderBox.blockSize) : Number.parseFloat(style.height) + extraHeight,
    }
  }
  updatePosition()
}, { box: 'border-box' })

useResizeObserver(clippingAncestors, updatePosition, { box: 'border-box' })
useResizeObserver(clippingAncestors, updatePosition, { box: 'content-box' })
// The document boundary is only measured on resize of the body, root or content.
function updateClippedPositionOnChange() {
  if (props.avoidClipping)
    updateClippedPosition()
}
useEventListener(globalThis.window, 'resize', updateClippedPositionOnChange)
useEventListener(globalThis.window, 'scroll', updateClippedPositionOnChange, { capture: true, passive: true })
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="forceMount || open"
    :force-mount="!menuContext.unmountOnHide.value"
    @after-leave="() => {
      size = undefined
      position = undefined
    }"
  >
    <Primitive
      v-bind="$attrs"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :data-state="getOpenState(open)"
      :data-orientation="menuContext.orientation"
      :style="{
        // Prevent interaction when animating out
        pointerEvents: !open && menuContext.isRootMenu ? 'none' : undefined,
        ['--reka-navigation-menu-viewport-width']: size ? `${size?.width}px` : undefined,
        ['--reka-navigation-menu-viewport-height']: size ? `${size?.height}px` : undefined,
        ['--reka-navigation-menu-viewport-left']: position ? `${position?.left}px` : undefined,
        ['--reka-navigation-menu-viewport-top']: position ? `${position?.top}px` : undefined,
      }"
      :hidden="!present"
      @pointerenter="menuContext.onContentEnter(menuContext.modelValue.value)"
      @pointerleave="whenMouse(() => menuContext.onContentLeave())($event)"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
