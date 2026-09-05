<script lang="ts">
import type { DisclosureState } from '@/shared'
import { useForwardExpose } from '@/shared'

export type TooltipTriggerDataState = DisclosureState

export interface TooltipTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { onMounted } from 'vue'
import { PopperAnchor } from '@/Popper'
import {
  Primitive,
} from '@/Primitive'
import { injectTooltipRootContext } from './TooltipRoot.vue'
import { createTooltipTriggerSurface } from './useTooltip'

const props = withDefaults(defineProps<TooltipTriggerProps>(), {
  as: 'button',
})
const rootContext = injectTooltipRootContext()

const { forwardRef, currentElement: triggerElement } = useForwardExpose()

// aria-describedby / data-state / data-delayed / the grace-area selector and
// every pointer / focus / click listener come from the shared trigger factory
// (single source with `useTooltip()`; called ONCE — it owns this instance's
// pointer state). The content id is populated by the composable, so nothing is
// back-filled onto the context here any more. Listener order is unchanged:
// `$attrs` fall through the as-child `PopperAnchor` and `Slot` merges them
// BEFORE the inner element's own props, so a consumer `@click` still runs
// before the surface's `onClick`.
const trigger = createTooltipTriggerSurface(rootContext)

onMounted(() => {
  rootContext.onTriggerChange(triggerElement.value)
})
</script>

<template>
  <PopperAnchor
    as-child
    :reference="reference"
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="props.asChild"
      v-bind="trigger.attrs.value"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
