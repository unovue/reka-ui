<script lang="ts">
import type {
  PopoverContentImplEmits,
  PopoverContentImplProps,
} from './PopoverContentImpl.vue'

export type PopoverContentEmits = PopoverContentImplEmits

export interface PopoverContentProps extends PopoverContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { useForwardExpose, useForwardPropsEmits, useId } from '@/shared'
import PopoverContentModal from './PopoverContentModal.vue'
import PopoverContentNonModal from './PopoverContentNonModal.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const rootContext = injectPopoverRootContext()

const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef } = useForwardExpose()

rootContext.contentId ||= useId(undefined, 'reka-popover-content')
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="forceMount || rootContext.open.value"
    :force-mount="forceMount || !rootContext.unmountOnHide.value"
  >
    <PopoverContentModal
      v-if="rootContext.modal.value"
      v-show="present"
      v-bind="forwarded"
      :ref="forwardRef"
    >
      <slot />
    </PopoverContentModal>
    <PopoverContentNonModal
      v-else
      v-show="present"
      v-bind="forwarded"
      :ref="forwardRef"
    >
      <slot />
    </PopoverContentNonModal>
  </Presence>
</template>
