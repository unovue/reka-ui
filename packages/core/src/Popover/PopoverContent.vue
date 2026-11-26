<script lang="ts">
import type {
  PopoverContentImplEmits,
  PopoverContentImplProps,
} from './PopoverContentImpl.vue'
import { computed, defineAsyncComponent } from 'vue'

const PopoverContentModal = defineAsyncComponent({
  loader: () => import('./PopoverContentModal.vue').then(m => m.default),
  suspensible: false,
})
const PopoverContentNonModal = defineAsyncComponent({
  loader: () => import('./PopoverContentNonModal.vue').then(m => m.default),
  suspensible: false,
})

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
import { vShowWhenKept } from '@/shared/vShowWhenKept'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const rootContext = injectPopoverRootContext()

const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef } = useForwardExpose()

rootContext.contentId ||= useId(undefined, 'reka-popover-content')

// The node stays in the DOM across open/close when force-mounted, or when the
// root opts out of unmounting. Only then does the child need the real presence
// state, since no physical unmount happens to end the layer's side effects.
const staysMounted = computed(() => props.forceMount || !rootContext.unmountOnHide.value)
// Hidden while closed only when kept mounted by the root: a force-mounted content is
// shown or hidden by the consumer. One branch either way, so that a change of
// `unmountOnHide` while open keeps the content and its state.
const hidesWhenClosed = computed(() => !props.forceMount && !rootContext.unmountOnHide.value)
const keptArg = computed(() => hidesWhenClosed.value ? 'kept' : null)
const contentComponent = computed(() => rootContext.modal.value ? PopoverContentModal : PopoverContentNonModal)
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="rootContext.open.value"
    :force-mount="staysMounted"
  >
    <component
      :is="contentComponent"
      v-bind="forwarded"
      :ref="forwardRef"
      v-show-when-kept:[keptArg]="hidesWhenClosed ? present : true"
      :present="staysMounted ? present : true"
    >
      <slot />
    </component>
  </Presence>
</template>
