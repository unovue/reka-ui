<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'

export interface TagGroupItemDeleteProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with the delete button. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectTagGroupItemContext } from './TagGroupItem.vue'

const props = withDefaults(defineProps<TagGroupItemDeleteProps>(), {
  as: 'button',
})

const itemContext = injectTagGroupItemContext()
const { forwardRef } = useForwardExpose()

const id = useId(undefined, 'reka-tag-group-item-delete')
const disabled = computed(() => itemContext.disabled.value || props.disabled)

// Only the focused tag's button is tabbable, so Tab moves from a tag to its
// delete button and then out of the group, like React Aria.
const tabindex = computed(() => itemContext.isTabStop.value ? 0 : -1)

function handleClick(event: MouseEvent) {
  // The tag itself toggles selection on click.
  event.stopPropagation()
  if (disabled.value) {
    event.preventDefault()
    return
  }

  itemContext.remove()
}
</script>

<template>
  <Primitive
    :id="id"
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' ? 'button' : undefined"
    aria-label="Remove"
    :aria-labelledby="`${id} ${itemContext.id}`"
    :tabindex="tabindex"
    :data-disabled="disabled ? '' : undefined"
    :disabled="props.as === 'button' ? disabled : undefined"
    @click="handleClick"
  >
    <slot />
  </Primitive>
</template>
