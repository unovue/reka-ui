<script lang="ts">
export interface HoverCardTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { mergeProps } from 'vue'
import { usePopperAnchor } from '@/Popper/usePopperAnchor'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'
import { getHoverCardTriggerSurface } from './useHoverCard'

defineOptions({
  // `$attrs` are merged under the part's own bindings: the precedence the
  // former `<PopperAnchor as-child>` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<HoverCardTriggerProps>(), {
  as: 'a',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectHoverCardRootContext()
rootContext.triggerElement = currentElement
usePopperAnchor({ element: currentElement, reference: () => props.reference })

// `data-state`, the `data-grace-area-trigger` selector and the hover / leave /
// touch / focus / blur listeners all come from the shared surface builder
// (single source with `useHoverCard()`); the PopperAnchor wrapper and the
// element registration above stay in the SFC. Listener order is unchanged:
// `$attrs` merge BEFORE the element's own props, so a consumer
// `@pointerenter` still runs before the surface's.
const trigger = getHoverCardTriggerSurface(rootContext)
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
