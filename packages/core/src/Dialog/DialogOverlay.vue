<script lang="ts">
import type { DialogOverlayImplProps } from './DialogOverlayImpl.vue'
import { useForwardExpose } from '@/shared'
import DialogOverlayImpl from './DialogOverlayImpl.vue'

export interface DialogOverlayProps extends DialogOverlayImplProps {
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
import { injectDialogRootContext } from './DialogRoot.vue'

const props = defineProps<DialogOverlayProps>()
const rootContext = injectDialogRootContext()

const { forwardRef } = useForwardExpose()

// See `DialogContent.vue`: when the overlay is kept mounted across open/close it
// must report the real presence state, otherwise `DialogOverlayImpl` keeps the
// body scroll locked after the dialog is dismissed.
const staysMounted = computed(
  () => props.forceMount || !rootContext.unmountOnHide.value,
)
</script>

<template>
  <Presence
    v-if="rootContext?.modal.value"
    v-slot="{ present }"
    :present="rootContext.open.value"
    :force-mount="staysMounted"
  >
    <DialogOverlayImpl
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      v-bind="$attrs"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :present="staysMounted ? present : true"
    >
      <slot />
    </DialogOverlayImpl>
  </Presence>
</template>
