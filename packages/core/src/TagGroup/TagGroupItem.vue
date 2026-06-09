<script lang="ts">
import type { ComputedRef } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { createContext, useForwardExpose } from '@/shared'

export interface TagGroupItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** A unique value for the tag item. */
  value: T
  /** When `true`, prevents the user from interacting with the tag item. */
  disabled?: boolean
}

interface TagGroupItemContext<T = AcceptableValue> {
  value: T
  disabled: ComputedRef<boolean>
  remove: () => void
}

export const [injectTagGroupItemContext, provideTagGroupItemContext]
  = createContext<TagGroupItemContext>('TagGroupItem')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectTagGroupRootContext } from './TagGroupRoot.vue'

const props = withDefaults(defineProps<TagGroupItemProps<T>>(), {
  as: 'div',
  disabled: false,
})

const rootContext = injectTagGroupRootContext<T>()
const { forwardRef } = useForwardExpose()

const disabled = computed(() => rootContext.disabled.value || props.disabled)
const isSelected = computed(() => rootContext.containsTag(props.value))

function remove() {
  if (!disabled.value)
    rootContext.removeTag(props.value)
}

provideTagGroupItemContext({
  value: props.value,
  disabled,
  remove,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    role="listitem"
    :tabindex="disabled ? undefined : 0"
    :data-disabled="disabled ? '' : undefined"
    :data-state="isSelected ? 'checked' : 'unchecked'"
    @keydown.delete.prevent="remove"
    @keydown.backspace.prevent="remove"
  >
    <slot />
  </Primitive>
</template>
