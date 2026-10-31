<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { selectionState, useForwardElement } from '@/shared'

export interface ListboxItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { renderAs } from '@/Primitive/renderAs'
import { useLingeringPresence } from '@/shared/useLingeringPresence'
import { injectListboxItemContext } from './ListboxItem.vue'

const props = withDefaults(defineProps<ListboxItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectListboxItemContext()

// Mounts no `Presence` while not shown; see `useLingeringPresence`.
const shown = () => props.forceMount || itemContext.isSelected.value
const lingering = useLingeringPresence(shown)
</script>

<template>
  <Presence
    v-if="lingering.mounted()"
    :present="shown()"
    :appear="lingering.appear()"
    @vue:mounted="lingering.onMounted"
    @complete="lingering.onComplete"
  >
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      aria-hidden="true"
      :data-state="selectionState(itemContext.isSelected.value)"
    >
      <slot />
    </component>
  </Presence>
</template>
