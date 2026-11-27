<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import { useForwardExpose } from '@/shared'
import { useAgentItem } from '@/shared/useAgentRegistration'
import { injectTagsInputItemContext } from './TagsInputItem.vue'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'

export interface TagsInputItemDeleteProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<TagsInputItemDeleteProps>(), {
  as: 'button',
})

useForwardExpose()
const context = injectTagsInputRootContext()
const itemContext = injectTagsInputItemContext()
useAgentItem(context, itemContext, undefined, 'delete')

const disabled = computed(() => itemContext.disabled?.value || context.disabled.value)

function handleDelete() {
  if (disabled.value)
    return
  itemContext.onRemove()
}
</script>

<template>
  <Primitive
    tabindex="-1"
    v-bind="props"
    :aria-labelledby="$attrs['aria-label'] ? undefined : itemContext.textId"
    :aria-current="itemContext.isSelected.value"
    :data-state="itemContext.isSelected.value ? 'active' : 'inactive'"
    :data-disabled="disabled ? '' : undefined"
    :type="as === 'button' ? 'button' : undefined"
    @click="handleDelete"
  >
    <slot />
  </Primitive>
</template>
