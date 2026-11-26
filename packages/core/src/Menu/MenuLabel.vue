<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { injectMenuGroupContext } from './MenuGroup.vue'

export interface MenuLabelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { claimReferencedId, useForwardElement } from '@/shared'

withDefaults(defineProps<MenuLabelProps>(), {
  as: 'div',
})

const groupContext = injectMenuGroupContext({ id: '' })
// A consumer `id` (or one on the asChild child) is the id the group's `aria-labelledby` references.
claimReferencedId(groupContext, 'id')

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :id="groupContext.id || undefined"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
