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
import { computed } from 'vue'
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

const staysMounted = computed(() => props.forceMount || !rootContext.unmountOnHide.value)
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="rootContext.open.value"
    :force-mount="staysMounted"
  >
    <PopoverContentModal
      v-if="rootContext.modal.value"
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      v-bind="forwarded"
      :ref="forwardRef"
      :present="staysMounted ? present : true"
    >
      <slot />
    </PopoverContentModal>
    <PopoverContentNonModal
      v-else
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      v-bind="forwarded"
      :ref="forwardRef"
      :present="staysMounted ? present : true"
    >
      <slot />
    </PopoverContentNonModal>
  </Presence>
</template>
