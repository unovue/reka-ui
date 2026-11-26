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
import { useForwardElement, useForwardPropsEmits, usePartId } from '@/shared'
import { vShowWhenKept } from '@/shared/vShowWhenKept'
import { isPortalOpening } from '@/Teleport/portalGate'
import PopoverContentModal from './PopoverContentModal.vue'
import PopoverContentNonModal from './PopoverContentNonModal.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const rootContext = injectPopoverRootContext()
// Forwarded as the element's `id`; mirrored into the context for the trigger's `aria-controls`.
const contentId = usePartId(() => props.id, rootContext, 'contentId')
// The template binds `id: contentId` after these, so the `id` prop never leaks through.
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

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
    :appear="isPortalOpening(rootContext)"
    :present="rootContext.open.value"
    :force-mount="staysMounted"
    @complete="rootContext.notifyOpenComplete"
  >
    <component
      :is="contentComponent"
      v-bind="{ ...forwarded, id: contentId }"
      :ref="forwardRef"
      v-show-when-kept:[keptArg]="hidesWhenClosed ? present : true"
      :present="staysMounted ? present : true"
    >
      <slot />
    </component>
  </Presence>
</template>
