<script lang="ts">
import type { DrawerContentImplEmits, DrawerContentImplProps } from './DrawerContentImpl.vue'

export type DrawerContentEmits = DrawerContentImplEmits
export interface DrawerContentProps extends Omit<DrawerContentImplProps, 'trapFocus'> {
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Presence } from '@/Presence'
import { useEmitAsProps, useForwardExpose, useHideOthers } from '@/shared'
import DrawerContentImpl from './DrawerContentImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = defineProps<DrawerContentProps>()
const emits = defineEmits<DrawerContentEmits>()

const rootContext = injectDrawerRootContext()
const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, currentElement } = useForwardExpose()
const hasInteractedOutside = ref(false)
const hasPointerDownOutside = ref(false)

// Modality tiers:
//   true           → full modal (focus trap + hide others + outside pointer events blocked)
//   'trap-focus'   → traps focus but does NOT block outside pointer events
//   false          → non-modal
const isFullModal = computed(() => rootContext.modal.value === true)
const isTrapFocusOnly = computed(() => rootContext.modal.value === 'trap-focus')
const shouldTrapFocus = computed(() => (isFullModal.value || isTrapFocusOnly.value) && rootContext.open.value)
const shouldHideOthers = computed(() => isFullModal.value ? currentElement.value : undefined)
useHideOthers(shouldHideOthers)

// Non-modal handlers defined as named functions so the refs are accessed via
// `.value` explicitly and the reads/writes are unambiguous.
function onCloseAutoFocusNonModal(e: Event) {
  if (!e.defaultPrevented) {
    if (!hasInteractedOutside.value)
      rootContext.triggerElement.value?.focus()
    e.preventDefault()
  }
  hasInteractedOutside.value = false
  hasPointerDownOutside.value = false
}

function onInteractOutsideNonModal(e: any) {
  if (!e.defaultPrevented) {
    hasInteractedOutside.value = true
    if (e.detail.originalEvent.type === 'pointerdown')
      hasPointerDownOutside.value = true
  }
  const target = e.target as HTMLElement
  if (rootContext.triggerElement.value?.contains(target))
    e.preventDefault()
  if (e.detail.originalEvent.type === 'focusin' && hasPointerDownOutside.value)
    e.preventDefault()
}
</script>

<template>
  <Presence :present="forceMount || rootContext.open.value">
    <DrawerContentImpl
      v-if="isFullModal"
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="true"
      @close-auto-focus="(e: Event) => {
        if (!e.defaultPrevented) {
          e.preventDefault()
          rootContext.triggerElement.value?.focus()
        }
      }"
      @pointer-down-outside="(e: any) => {
        const orig = e.detail.originalEvent
        const isRightClick = orig.button === 2 || (orig.button === 0 && orig.ctrlKey)
        if (isRightClick) e.preventDefault()
      }"
      @focus-outside="(e: Event) => e.preventDefault()"
    >
      <slot />
    </DrawerContentImpl>

    <DrawerContentImpl
      v-else
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="false"
      @close-auto-focus="onCloseAutoFocusNonModal"
      @interact-outside="onInteractOutsideNonModal"
    >
      <slot />
    </DrawerContentImpl>
  </Presence>
</template>
