<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

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
  disabled: false,
})

const itemContext = injectTagGroupItemContext()
const { forwardRef } = useForwardExpose()

const disabled = computed(() => itemContext.disabled.value || props.disabled)

function handleClick(event: MouseEvent) {
  if (disabled.value) {
    event.preventDefault()
    return
  }

  itemContext.remove()
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' ? 'button' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :disabled="props.as === 'button' ? disabled : undefined"
    @click.stop="handleClick"
  >
    <slot />
  </Primitive>
</template>
