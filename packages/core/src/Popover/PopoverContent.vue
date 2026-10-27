<script lang="ts">
import type {
  PopoverContentImplEmits,
  PopoverContentImplProps,
} from './PopoverContentImpl.vue'

export type PopoverContentEmits = PopoverContentImplEmits

export interface PopoverContentProps extends PopoverContentImplProps {
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
import { Presence } from '@/Presence'
import { useForwardElement, useForwardPropsEmits, usePartId } from '@/shared'
import PopoverContentModal from './PopoverContentModal.vue'
import PopoverContentNonModal from './PopoverContentNonModal.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const rootContext = injectPopoverRootContext()
usePartId(() => props.id, rootContext.contentId, (id) => { rootContext.contentId = id })

// The content surface renders the context's id.
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
      v-bind="forwarded"
      :ref="forwardRef"
    >
      <slot />
    </PopoverContentModal>
    <PopoverContentNonModal
      v-else
      v-bind="forwarded"
      :ref="forwardRef"
    >
      <slot />
    </PopoverContentNonModal>
  </Presence>
</template>
