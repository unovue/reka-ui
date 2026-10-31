<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement, useId } from '@/shared'

export interface TagGroupItemDeleteProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with the delete button. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectTagGroupItemContext } from './TagGroupItem.vue'
import { getTagGroupItemDeleteSurface } from './useTagGroup'

const props = withDefaults(defineProps<TagGroupItemDeleteProps>(), {
  as: 'button',
})

const itemContext = injectTagGroupItemContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// Same derivation as `useTagGroup().getItemDeleteSurface`; the tag-dependent
// `type` / `disabled` attributes stay here.
const button = getTagGroupItemDeleteSurface(itemContext, {
  id: useId(undefined, 'reka-tag-group-item-delete'),
  disabled: () => props.disabled,
})
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    :type="props.as === 'button' ? 'button' : undefined"
    v-bind="button.attrs.value"
    :disabled="props.as === 'button' ? button.state.value.disabled : undefined"
  >
    <slot />
  </component>
</template>
