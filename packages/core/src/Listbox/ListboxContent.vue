<script lang="ts">
import type { PrimitiveProps } from '..'
import { refAutoReset } from '@vueuse/shared'
import { Primitive } from '..'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { getListboxContentSurface } from './useListbox'

export interface ListboxContentProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { useCollection } from '@/Collection'

defineProps<ListboxContentProps>()

const { CollectionSlot } = useCollection()
const rootContext = injectListboxRootContext()

const isClickFocus = refAutoReset(false, 10)

// role/tabindex/aria/data-orientation and the mousedown/focus/keydown handlers
// come from the shared surface builder (single source with `useListboxRoot()`);
// the collection slot wrapper stays in the SFC.
const surface = getListboxContentSurface(rootContext, { isClickFocus })
</script>

<template>
  <CollectionSlot>
    <Primitive
      :as="as"
      :as-child="asChild"
      v-bind="surface.attrs.value"
    >
      <slot />
    </Primitive>
  </CollectionSlot>
</template>
