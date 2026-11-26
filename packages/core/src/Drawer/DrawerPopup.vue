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
</script>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { Presence } from '@/Presence'
import { useBodyScrollLock, useEmitAsProps, useForwardElement, useHideOthers, usePartId } from '@/shared'
import { isPortalOpening } from '@/Teleport/portalGate'
import DrawerContentImpl from './DrawerContentImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { useDrawerContentModality } from './useDrawer'

const props = withDefaults(defineProps<DrawerPopupProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerPopupEmits>()

const rootContext = injectDrawerRootContext()
// Forwarded as the element's `id` (merged after the surface's context id);
// mirrored into the context for the trigger's `aria-controls`.
const contentId = usePartId(() => props.id, rootContext, 'contentId')
const emitsAsProps = useEmitAsProps(emits)
// `forceMount` belongs to the `Presence` here, not to the content element.
const forwardedProps = computed(() => {
  const { forceMount: _, ...rest } = props
  return rest
})
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

// A closed force-mounted content removed later has already returned focus on
// close (above): its final unmount leaves focus where it is.
function skipsUnmountFocus() {
  return props.forceMount && !rootContext.open.value
}
function onCloseAutoFocusModalOnce(event: Event) {
  if (skipsUnmountFocus()) {
    event.preventDefault()
    return
  }
  onCloseAutoFocusModal(event)
}
function onCloseAutoFocusNonModalOnce(event: Event) {
  if (skipsUnmountFocus()) {
    event.preventDefault()
    return
  }
  onCloseAutoFocusNonModal(event)
}
// Only while open: a `forceMount`ed drawer that is closed hides nothing and
// mounts no backdrop.
const shouldHideOthers = computed(() => isFullModal.value && rootContext.open.value ? currentElement.value : undefined)
useHideOthers(shouldHideOthers)

// A close is reported once the exit animation ends. When the popup is removed
// before that (its parent stopped rendering it), the close is complete.
let isClosePending = false
watch(() => rootContext.open.value, (open) => {
  isClosePending = !open
})
function onPresenceComplete(value: boolean) {
  isClosePending = false
  rootContext.notifyOpenComplete?.(value)
}
onUnmounted(() => {
  if (isClosePending && !rootContext.open.value)
    rootContext.notifyOpenComplete?.(false)
})

// BaseUI parity (`useDialogRoot`): only a fully modal drawer locks page scroll,
// with or without a `DrawerBackdrop`; `'trap-focus'` leaves the page scrollable.
const scrollLocked = useBodyScrollLock(isFullModal.value && rootContext.open.value)
watch(() => isFullModal.value && rootContext.open.value, (locked) => {
  scrollLocked.value = locked
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    :appear="isPortalOpening(rootContext)"
    :present="rootContext.open.value"
    :force-mount="forceMount"
    @complete="onPresenceComplete"
  >
    <DrawerContentImpl
      v-if="isFullModal"
      :ref="forwardRef"
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs, id: contentId }"
      :present="forceMount ? present : true"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="rootContext.open.value"
      @close-auto-focus="onCloseAutoFocusModalOnce"
      @pointer-down-outside="onPointerDownOutsideModal"
      @focus-outside="onFocusOutsideModal"
    >
      <slot />
    </DrawerContentImpl>

    <DrawerContentImpl
      v-else
      :ref="forwardRef"
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs, id: contentId }"
      :present="forceMount ? present : true"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="false"
      @close-auto-focus="onCloseAutoFocusNonModalOnce"
      @interact-outside="onInteractOutsideNonModal"
    >
      <slot />
    </DrawerContentImpl>
  </Presence>
</template>
