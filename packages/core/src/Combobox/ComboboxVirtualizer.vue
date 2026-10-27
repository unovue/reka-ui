<script lang="ts">
export interface ComboboxVirtualizerProps<T extends AcceptableValue = AcceptableValue> extends ListboxVirtualizerProps<T> {}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { ListboxVirtualizerProps } from '@/Listbox/ListboxVirtualizer.vue'
import type { VirtualGroup } from '@/Listbox/useListVirtualizer'
import type { AcceptableValue } from '@/shared/types'
import ListboxVirtualizer from '@/Listbox/ListboxVirtualizer.vue'
import { useForwardElement } from '@/shared'

const props = defineProps<ComboboxVirtualizerProps<T>>()

defineSlots<{
  default?: (props: {
    option: T
    virtualizer: Virtualizer<HTMLElement, Element>
    virtualItem: VirtualItem
  }) => any
  /** A group header row, when `options` holds groups. */
  group?: (props: {
    group: VirtualGroup<T>
    virtualItem: VirtualItem
  }) => any
}>()

// The root's `filter` applies to `options` (the Listbox virtualizer path):
// an option that does not match takes no row, no `aria-setsize` slot and is
// skipped by navigation; a group with no match is dropped.
// `ListboxVirtualizer` also flags the root as virtual.
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <ListboxVirtualizer
    :ref="forwardRef"
    v-bind="props"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
    <template
      v-if="$slots.group"
      #group="slotProps"
    >
      <slot
        name="group"
        v-bind="slotProps"
      />
    </template>
  </ListboxVirtualizer>
</template>
