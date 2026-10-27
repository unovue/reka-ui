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
import { reactiveOmit } from '@vueuse/shared'
import { computed } from 'vue'
import { Presence } from '@/Presence'
import { useEmitAsProps, useForwardElement, usePartId } from '@/shared'
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
usePartId(() => props.id, rootContext.contentId, (id) => { rootContext.contentId = id })
// The content surface renders the context's id; an `id: undefined` forwarded
// here would override it through `$attrs`.
const forwardedProps = reactiveOmit(props, 'id')

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
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="rootContext.open.value"
    :force-mount="staysMounted"
    @complete="rootContext.notifyOpenComplete"
  >
    <DialogContentModal
      v-if="rootContext.modal.value"
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      :ref="forwardRef"
      :present="staysMounted ? present : true"
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </DialogContentModal>
    <DialogContentNonModal
      v-else
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      :ref="forwardRef"
      :present="staysMounted ? present : true"
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </DialogContentNonModal>
  </Presence>
</template>
