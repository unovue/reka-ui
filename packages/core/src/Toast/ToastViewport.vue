<script lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { getActiveElement, useForwardExpose } from '@/shared'

export interface ToastViewportProps extends PrimitiveProps {
  /**
   * The keys to use as the keyboard shortcut that will move focus to the toast viewport.
   * @defaultValue ['F8']
   */
  hotkey?: string[]
  /**
   * An author-localized label for the toast viewport to provide context for screen reader users
   * when navigating page landmarks. The available `{hotkey}` placeholder will be replaced for you.
   * Alternatively, you can pass in a custom function to generate the label.
   * @defaultValue 'Notifications ({hotkey})'
   */
  label?: string | ((hotkey: string) => string)
}
</script>

<script setup lang="ts">
import { onKeyStroke, unrefElement, useEventListener } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, toRefs, watch, watchEffect } from 'vue'
import { DismissableLayerBranch } from '@/DismissableLayer'
import { focusFirst, getTabbableCandidates, getTabStopsAfter } from '@/FocusScope/utils'
import { Primitive } from '@/Primitive'
import FocusProxy from './FocusProxy.vue'
import { injectToastProviderContext } from './ToastProvider.vue'
import { VIEWPORT_PAUSE, VIEWPORT_RESUME } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastViewportProps>(), {
  hotkey: () => ['F8'], // from VIEWPORT_DEFAULT_HOTKEY
  label: 'Notifications ({hotkey})',
  as: 'ol',
})
const { hotkey, label } = toRefs(props)

const { forwardRef, currentElement } = useForwardExpose()
const { CollectionSlot, getItems } = useCollection()
const providerContext = injectToastProviderContext()
const hasToasts = computed(() => providerContext.toastCount.value > 0)
const headFocusProxyRef = ref<HTMLElement>()
const tailFocusProxyRef = ref<HTMLElement>()
const windowBlurred = ref(false)

const KEY_RE = /Key/g
const DIGIT_RE = /Digit/g
const hotkeyMessage = computed(() => hotkey.value.join('+').replace(KEY_RE, '').replace(DIGIT_RE, ''))

// `currentElement` re-resolves only when this component updates. An `asChild` child that
// the parent swaps (e.g. with `v-if`) re-renders only the slot, so the element is re-read
// whenever the children of the branch element change instead.
const branchRef = ref<ComponentPublicInstance>()
let primitiveRef: Element | ComponentPublicInstance | null = null
const viewportElement = shallowRef<HTMLElement>()
let observer: MutationObserver | undefined

function forwardPrimitiveRef(ref: Element | ComponentPublicInstance | null) {
  primitiveRef = ref
  forwardRef(ref)
}

onKeyStroke(hotkey.value, () => {
  viewportElement.value?.focus()
})

onMounted(() => {
  providerContext.onViewportChange(currentElement.value)
  viewportElement.value = currentElement.value
  observer = new MutationObserver(() => {
    const element = unrefElement(primitiveRef as ComponentPublicInstance)
    // An `asChild` slot that renders nothing leaves a comment anchor, which can't hold toasts.
    if (element instanceof HTMLElement)
      viewportElement.value = element
  })
  observer.observe(unrefElement(branchRef)!, { childList: true })
})

onBeforeUnmount(() => observer?.disconnect())

// Collapse only once closing toasts have finished animating, so the stack does not
// shift under the pointer while a toast is dismissed.
const pendingPointerLeave = ref(false)

// Toasts teleport into and listen on `providerContext.viewport`, so keep it on the
// current element when the element is replaced after mount.
watch(viewportElement, (element) => {
  const previous = providerContext.viewport.value
  if (!element || !previous || element === previous)
    return

  // The pause listeners on the old element are gone, and focus or hover inside it went
  // with it, so release its pause while the toasts still listen there. A window-blur
  // pause is kept: the window `focus` listener on the new element releases it.
  if (providerContext.isClosePausedRef.value && document.hasFocus()) {
    previous.dispatchEvent(new CustomEvent(VIEWPORT_RESUME))
    providerContext.isClosePausedRef.value = false
  }
  providerContext.focused.value = element.contains(getActiveElement())
  // The old element took its `pointerleave` with it. Collapse as a leave would, and a
  // `pointermove` on the new element expands the stack again.
  pendingPointerLeave.value = true
  providerContext.onViewportChange(element)
}, { flush: 'post' })

watch([pendingPointerLeave, providerContext.closingCount], ([pending, closingCount]) => {
  if (pending && closingCount === 0) {
    providerContext.hovering.value = false
    pendingPointerLeave.value = false
  }
})

watch(hasToasts, (value) => {
  if (!value) {
    providerContext.hovering.value = false
    providerContext.focused.value = false
    pendingPointerLeave.value = false
  }
})

function pause(viewport: HTMLElement | undefined) {
  if (!providerContext.isClosePausedRef.value) {
    viewport?.dispatchEvent(new CustomEvent(VIEWPORT_PAUSE))
    providerContext.isClosePausedRef.value = true
  }
}

function releasePause(viewport: HTMLElement | undefined) {
  if (providerContext.isClosePausedRef.value) {
    viewport?.dispatchEvent(new CustomEvent(VIEWPORT_RESUME))
    providerContext.isClosePausedRef.value = false
  }
}

// Releases a blur pause, including one left over after the last toast closed, which would
// otherwise keep later toasts from ever starting their timers.
useEventListener('focus', () => {
  windowBlurred.value = false
  releasePause(viewportElement.value)
})

watch(providerContext.pauseOnInteraction, (pauseOnInteraction) => {
  if (!pauseOnInteraction)
    releasePause(viewportElement.value)
  else if (hasToasts.value && (providerContext.hovering.value || providerContext.focused.value || windowBlurred.value))
    pause(viewportElement.value)
})

watchEffect((cleanupFn) => {
  const viewport = viewportElement.value
  if (hasToasts.value && viewport) {
    const handlePauseIfEnabled = () => {
      if (providerContext.pauseOnInteraction.value)
        pause(viewport)
    }

    const handleWindowBlur = () => {
      windowBlurred.value = true
      handlePauseIfEnabled()
    }

    const handleResume = () => releasePause(viewport)

    const handleFocusOutResume = (event: FocusEvent) => {
      const isFocusMovingOutside = !viewport.contains(event.relatedTarget as HTMLElement)
      if (isFocusMovingOutside) {
        providerContext.focused.value = false
        handleResume()
      }
    }

    const handlePointerLeaveResume = () => {
      pendingPointerLeave.value = true
      const isFocusInside = viewport.contains(getActiveElement())
      if (!isFocusInside)
        handleResume()
    }

    const handlePointerMoveExpand = () => {
      pendingPointerLeave.value = false
      providerContext.hovering.value = true
    }

    const handleFocusInExpand = () => {
      providerContext.focused.value = true
    }

    // We programmatically manage tabbing as we are unable to influence
    // the source order with portals, this allows us to reverse the
    // tab order so that it runs from most recent toast to least
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
      const isTabKey = event.key === 'Tab' && !isMetaKey

      if (isTabKey) {
        const focusedElement = getActiveElement()
        const isTabbingBackwards = event.shiftKey
        const targetIsViewport = event.target === viewport

        // If we're back tabbing after jumping to the viewport then we simply
        // proxy focus out to the preceding document
        if (targetIsViewport && isTabbingBackwards) {
          headFocusProxyRef.value?.focus()
          return
        }

        const tabbingDirection = isTabbingBackwards ? 'backwards' : 'forwards'
        const sortedCandidates = getSortedTabbableCandidates({ tabbingDirection })
        if (focusFirst(getTabStopsAfter(sortedCandidates, focusedElement))) {
          event.preventDefault()
        }
        else {
          // If we can't focus that means we're at the edges so we
          // proxy to the corresponding exit point and let the browser handle
          // tab/shift+tab keypress and implicitly pass focus to the next valid element in the document
          isTabbingBackwards
            ? headFocusProxyRef.value?.focus()
            : tailFocusProxyRef.value?.focus()
        }
      }
    }

    viewport.addEventListener('focusin', handlePauseIfEnabled)
    viewport.addEventListener('focusin', handleFocusInExpand)
    viewport.addEventListener('focusout', handleFocusOutResume)
    viewport.addEventListener('pointermove', handlePauseIfEnabled)
    viewport.addEventListener('pointermove', handlePointerMoveExpand)
    viewport.addEventListener('pointerleave', handlePointerLeaveResume)
    viewport.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleWindowBlur)

    cleanupFn(() => {
      viewport.removeEventListener('focusin', handlePauseIfEnabled)
      viewport.removeEventListener('focusin', handleFocusInExpand)
      viewport.removeEventListener('focusout', handleFocusOutResume)
      viewport.removeEventListener('pointermove', handlePauseIfEnabled)
      viewport.removeEventListener('pointermove', handlePointerMoveExpand)
      viewport.removeEventListener('pointerleave', handlePointerLeaveResume)
      viewport.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleWindowBlur)
      if (document.hasFocus())
        releasePause(viewport)
    })
  }
})

function getSortedTabbableCandidates({ tabbingDirection }: { tabbingDirection: 'forwards' | 'backwards' }) {
  const toastItems = getItems().map(i => i.ref)
  const tabbableCandidates = toastItems.map((toastNode) => {
    const toastTabbableCandidates = [toastNode, ...getTabbableCandidates(toastNode)]
    return tabbingDirection === 'forwards'
      ? toastTabbableCandidates
      : toastTabbableCandidates.reverse()
  })
  return (
    tabbingDirection === 'forwards' ? tabbableCandidates.reverse() : tabbableCandidates
  ).flat()
}
</script>

<template>
  <DismissableLayerBranch
    ref="branchRef"
    role="region"
    :aria-label="typeof label === 'string' ? label.replace('{hotkey}', hotkeyMessage) : label(hotkeyMessage)"
    tabindex="-1"
    :style="{
      // incase list has size when empty (e.g. padding), we remove pointer events so
      // it doesn't prevent interactions with page elements that it overlays
      pointerEvents: hasToasts ? undefined : 'none',
    }"
  >
    <FocusProxy
      v-if="hasToasts"
      :ref="(node: Element | ComponentPublicInstance | null) => {
        if (!node) return undefined
        headFocusProxyRef = unrefElement(node as ComponentPublicInstance) as HTMLElement
        return undefined
      }"
      @focus-from-outside-viewport="() => {
        const tabbableCandidates = getSortedTabbableCandidates({
          tabbingDirection: 'forwards',
        })
        focusFirst(tabbableCandidates)
      }"
    />
    <CollectionSlot>
      <Primitive
        :ref="forwardPrimitiveRef"
        tabindex="-1"
        :as="as"
        :as-child="asChild"
        :data-expanded="providerContext.expanded.value ? '' : undefined"
        :style="{
          '--reka-toast-frontmost-height': providerContext.frontmostHeight.value
            ? `${providerContext.frontmostHeight.value}px`
            : undefined,
        }"
        v-bind="$attrs"
      >
        <slot />
      </Primitive>
    </CollectionSlot>
    <FocusProxy
      v-if="hasToasts"
      :ref="(node: Element | ComponentPublicInstance | null) => {
        if (!node) return undefined
        tailFocusProxyRef = unrefElement(node as ComponentPublicInstance) as HTMLElement
        return undefined
      }"
      @focus-from-outside-viewport="() => {
        const tabbableCandidates = getSortedTabbableCandidates({
          tabbingDirection: 'backwards',
        })
        focusFirst(tabbableCandidates)
      }"
    />
  </DismissableLayerBranch>
</template>
