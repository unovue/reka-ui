<script lang="ts">
import type { DrawerContentImplEmits, DrawerContentImplProps } from './DrawerContentImpl.vue'

export type DrawerPopupEmits = DrawerContentImplEmits
export interface DrawerPopupProps extends Omit<DrawerContentImplProps, 'trapFocus'> {
  forceMount?: boolean
}
/** @deprecated Use `DrawerPopupEmits`; `DrawerContent` is a deprecated alias of `DrawerPopup`. */
export type DrawerContentEmits = DrawerPopupEmits
/** @deprecated Use `DrawerPopupProps`; `DrawerContent` is a deprecated alias of `DrawerPopup`. */
export type DrawerContentProps = DrawerPopupProps
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Presence } from '@/Presence'
import { useBodyScrollLock, useEmitAsProps, useForwardElement, useHideOthers } from '@/shared'
import DrawerContentImpl from './DrawerContentImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { useDrawerContentModality } from './useDrawer'

const props = withDefaults(defineProps<DrawerPopupProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerPopupEmits>()

const rootContext = injectDrawerRootContext()
const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Modality tiers (`true` / `'trap-focus'` / `false`) and their focus-return /
// outside-interaction handlers come from the composable; Presence and
// `useHideOthers` stay here.
const {
  isFullModal,
  shouldTrapFocus,
  onCloseAutoFocusModal,
  onPointerDownOutsideModal,
  onFocusOutsideModal,
  onCloseAutoFocusNonModal,
  onInteractOutsideNonModal,
  onCloseWhileMounted,
} = useDrawerContentModality({
  rootContext,
  contentElement: currentElement,
  finalFocus: () => props.finalFocus,
})

// A `forceMount`ed content stays mounted on close, so `FocusScope` never
// unmounts and `close-auto-focus` never fires: return focus here instead,
// as `DialogContentModal` / `DialogContentNonModal` do.
watch(() => rootContext.open.value, (isOpen, wasOpen) => {
  if (props.forceMount && wasOpen && !isOpen)
    onCloseWhileMounted()
}, { flush: 'post' })
// Only while open: a `forceMount`ed drawer that is closed hides nothing and
// mounts no backdrop.
const shouldHideOthers = computed(() => isFullModal.value && rootContext.open.value ? currentElement.value : undefined)
useHideOthers(shouldHideOthers)

// BaseUI parity (`useDialogRoot`): only a fully modal drawer locks page scroll,
// with or without a `DrawerOverlay`; `'trap-focus'` leaves the page scrollable.
const scrollLocked = useBodyScrollLock(isFullModal.value && rootContext.open.value)
watch(() => isFullModal.value && rootContext.open.value, (locked) => {
  scrollLocked.value = locked
})
</script>

<template>
  <Presence
    :present="rootContext.open.value"
    :force-mount="forceMount"
    @complete="rootContext.notifyOpenComplete"
  >
    <DrawerContentImpl
      v-if="isFullModal"
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="rootContext.open.value"
      @close-auto-focus="onCloseAutoFocusModal"
      @pointer-down-outside="onPointerDownOutsideModal"
      @focus-outside="onFocusOutsideModal"
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
