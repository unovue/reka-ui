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
import { reactiveOmit } from '@vueuse/shared'
import { Presence } from '@/Presence'
import { useForwardElement, useForwardPropsEmits, usePartId } from '@/shared'
import PopoverContentModal from './PopoverContentModal.vue'
import PopoverContentNonModal from './PopoverContentNonModal.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const rootContext = injectPopoverRootContext()
// Forwarded as the element's `id`; mirrored into the context for the trigger's `aria-controls`.
const contentId = usePartId(() => props.id, rootContext, 'contentId')
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'id'), emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Presence
    :present="rootContext.open.value"
    :force-mount="forceMount"
    @complete="rootContext.notifyOpenComplete"
  >
    <PopoverContentModal
      v-if="rootContext.modal.value"
      v-bind="{ ...forwarded, id: contentId }"
      :ref="forwardRef"
    >
      <slot />
    </PopoverContentModal>
    <PopoverContentNonModal
      v-else
      v-bind="{ ...forwarded, id: contentId }"
      :ref="forwardRef"
    >
      <slot />
    </PopoverContentNonModal>
  </Presence>
</template>
