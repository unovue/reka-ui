<script lang="ts">
import type { CollapsibleContentProps } from '../Collapsible'
import type { WrapperSpec } from '@/shared/splitWrapperAttrs'

export interface AccordionContentProps extends CollapsibleContentProps {}

// What `CollapsibleContent` declares, for the attrs it would have received. Its props are this
// part's own, so none of them reach the attrs.
const COLLAPSIBLE_CONTENT: WrapperSpec = { props: {}, emits: ['contentFound'] }
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { createWrapperEmit, splitWrapperAttrs, useUntrackedAttrs } from '@/shared/splitWrapperAttrs'
import { useCollapsibleContent } from '../Collapsible/useCollapsibleContent'
import { injectAccordionItemContext } from './AccordionItem.vue'
import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionContentSurface } from './useAccordion'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<AccordionContentProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()
const surface = getAccordionContentSurface(rootContext, itemContext)

// The part renders the element of the `CollapsibleContent` it used to render, with the same
// setup: that component received the content surface's attrs under this part's own, and the
// listeners for its `contentFound` event among them.
const attrs = useUntrackedAttrs()
const collapsibleAttrs = () => splitWrapperAttrs(mergeProps(surface.attrs.value, attrs), COLLAPSIBLE_CONTENT)
const emitCollapsible = createWrapperEmit(collapsibleAttrs)
const content = useCollapsibleContent(props, event => emitCollapsible('onContentFound', event))
defineExpose(content.expose)
</script>

<template>
  <component
    :is="renderAs(as, props.asChild)"
    v-bind="content.attrs(collapsibleAttrs().rest)"
    :ref="content.forwardRef"
  >
    <slot v-if="content.showsSlot()" />
  </component>
</template>
