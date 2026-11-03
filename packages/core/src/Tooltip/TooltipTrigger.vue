<script lang="ts">
import type { DisclosureState } from '@/shared'
import { useForwardElement } from '@/shared'

export type TooltipTriggerDataState = DisclosureState

export interface TooltipTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { mergeProps, watch } from 'vue'
import { usePopperAnchor } from '@/Popper/usePopperAnchor'
import { renderAs } from '@/Primitive/renderAs'
import { injectTooltipRootContext } from './TooltipRoot.vue'
import { createTooltipTriggerSurface } from './useTooltip'

defineOptions({
  // `$attrs` are merged under the part's own bindings: the precedence the
  // former `<PopperAnchor as-child>` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TooltipTriggerProps>(), {
  as: 'button',
})
const rootContext = injectTooltipRootContext()

const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)

// aria-describedby / data-state / data-delayed / the grace-area selector and
// every pointer / focus / click listener come from the shared trigger factory
// (single source with `useTooltip()`; called ONCE — it owns this instance's
// pointer state). The content id is populated by the composable, so nothing is
// back-filled onto the context here any more. Listener order is unchanged:
// `$attrs` merge BEFORE the element's own props, so a consumer `@click`
// still runs before the surface's `onClick`.
const trigger = createTooltipTriggerSurface(rootContext)

usePopperAnchor({ element: triggerElement, reference: () => props.reference })

watch(triggerElement, (el) => {
  rootContext.onTriggerChange(el)
}, { immediate: true })
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps($attrs, trigger.attrs.value)"
  >
    <slot />
  </component>
</template>
