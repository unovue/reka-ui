<script lang="ts">
import type { DrawerContentImplEmits, DrawerContentImplProps } from './DrawerContentImpl.vue'

export type DrawerPopupEmits = Omit<DrawerContentImplEmits, 'closeAutoFocus'> & {
  /**
   * Event handler called when focus moves back on close (to the trigger, or `finalFocus`). Can be prevented. Not
   * emitted for a `forceMount` popup, which stays mounted: it returns focus itself on close, while focus is still
   * inside it or on `<body>`; use `finalFocus` to change or turn off that return.
   */
  closeAutoFocus: [event: Event]
}
// `trapFocus` and `disableOutsidePointerEvents` follow `modal` on the root; the
// popup sets both itself.
export interface DrawerPopupProps extends Omit<DrawerContentImplProps, 'trapFocus' | 'disableOutsidePointerEvents'> {
  forceMount?: boolean
  /**
   * Id of the element, which the trigger's `aria-controls` points at.
   * Auto-generated when not provided.
   */
  id?: string
}
/** @deprecated Use `DrawerPopupEmits`; `DrawerContent` is a deprecated alias of `DrawerPopup`. */
export type DrawerContentEmits = DrawerPopupEmits
/** @deprecated Use `DrawerPopupProps`; `DrawerContent` is a deprecated alias of `DrawerPopup`. */
export type DrawerContentProps = DrawerPopupProps
</script>

<script setup lang="ts">
import { reactiveOmit } from '@vueuse/shared'
import { computed, watch } from 'vue'
import { Presence } from '@/Presence'
import { useBodyScrollLock, useEmitAsProps, useForwardElement, useHideOthers, usePartId } from '@/shared'
import DrawerContentImpl from './DrawerContentImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { useDrawerContentModality } from './useDrawer'

const props = withDefaults(defineProps<DrawerPopupProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerPopupEmits>()

const rootContext = injectDrawerRootContext()
usePartId(() => props.id, rootContext.contentId, (id) => { rootContext.contentId = id })
// The content surface renders the context's id; an `id: undefined` forwarded
// here would override it through `$attrs`.
const forwardedProps = reactiveOmit(props, 'id')
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
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs }"
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
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs }"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="false"
      @close-auto-focus="onCloseAutoFocusNonModal"
      @interact-outside="onInteractOutsideNonModal"
    >
      <slot />
    </DrawerContentImpl>
  </Presence>
</template>
