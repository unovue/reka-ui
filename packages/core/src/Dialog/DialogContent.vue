<script lang="ts">
import type {
  DialogContentImplEmits,
  DialogContentImplProps,
} from './DialogContentImpl.vue'

export type DialogContentEmits = DialogContentImplEmits

export interface DialogContentProps extends Omit<DialogContentImplProps, 'trapFocus'> {
  /**
   * Id of the element, which the trigger's `aria-controls` points at.
   * Auto-generated when not provided.
   */
  id?: string
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Presence } from '@/Presence'
import { useEmitAsProps, useForwardElement, usePartId } from '@/shared'
import { vShowWhenKept } from '@/shared/vShowWhenKept'
import { isPortalOpening } from '@/Teleport/portalGate'
import DialogContentModal from './DialogContentModal.vue'
import DialogContentNonModal from './DialogContentNonModal.vue'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogContentProps>(), {
  // Keep `undefined` (instead of Vue's boolean coercion to `false`) so the
  // modal/non-modal child can apply its own default. This lets a modal
  // `DialogContent` stay locked by default while still honoring an explicit
  // `:disable-outside-pointer-events="false"` (#2677).
  disableOutsidePointerEvents: undefined,
})
const emits = defineEmits<DialogContentEmits>()

const rootContext = injectDialogRootContext()
// Forwarded as the element's `id` (merged after the surface's context id);
// mirrored into the context for the trigger's `aria-controls`.
const contentId = usePartId(() => props.id, rootContext, 'contentId')

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The node stays in the DOM across open/close when force-mounted, or when the
// root opts out of unmounting. Only then does the child need the real presence
// state: mount-keyed behaviour (`FocusScope`'s auto-focus, layer stacks) has to
// be re-keyed on `present` because no physical unmount happens. When the node
// does unmount on close, keep passing a constant `true` so the child is never
// briefly told it is absent while `usePresence` settles on `MOUNT`.
const staysMounted = computed(
  () => props.forceMount || !rootContext.unmountOnHide.value,
)
// Hidden while closed only when kept mounted by the root: a force-mounted content is
// shown or hidden by the consumer. One branch either way, so that a change of
// `unmountOnHide` while open keeps the content and its state, and a wrapping
// `<Transition>` runs its enter hook once.
const hidesWhenClosed = computed(() => !props.forceMount && !rootContext.unmountOnHide.value)
const keptArg = computed(() => hidesWhenClosed.value ? 'kept' : null)
const contentComponent = computed(() => rootContext.modal.value ? DialogContentModal : DialogContentNonModal)
</script>

<template>
  <Presence
    v-slot="{ present }"
    :appear="isPortalOpening(rootContext)"
    :present="rootContext.open.value"
    :force-mount="staysMounted"
    @complete="rootContext.notifyOpenComplete"
  >
    <component
      :is="contentComponent"
      :ref="forwardRef"
      v-show-when-kept:[keptArg]="hidesWhenClosed ? present : true"
      :present="staysMounted ? present : true"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs, id: contentId }"
    >
      <slot />
    </component>
  </Presence>
</template>
