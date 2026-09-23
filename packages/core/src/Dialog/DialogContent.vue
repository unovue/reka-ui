<script lang="ts">
import type {
  DialogContentImplEmits,
  DialogContentImplProps,
} from './DialogContentImpl.vue'

export type DialogContentEmits = DialogContentImplEmits

export interface DialogContentProps extends Omit<DialogContentImplProps, 'trapFocus'> {
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
import { useEmitAsProps, useForwardExpose } from '@/shared'
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

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef } = useForwardExpose()

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
  >
    <DialogContentModal
      v-if="rootContext.modal.value"
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      :ref="forwardRef"
      :present="staysMounted ? present : true"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </DialogContentModal>
    <DialogContentNonModal
      v-else
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      :ref="forwardRef"
      :present="staysMounted ? present : true"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </DialogContentNonModal>
  </Presence>
</template>
