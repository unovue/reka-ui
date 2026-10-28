<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface RadioGroupIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { Presence } from '@/Presence'
import { renderAs } from '@/Primitive/renderAs'
import { useLingeringPresence } from '@/shared/useLingeringPresence'
import { injectRadioGroupItemContext } from './RadioGroupItem.vue'
import { getRadioGroupIndicatorSurface } from './useRadioGroup'

const props = withDefaults(defineProps<RadioGroupIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectRadioGroupItemContext()
// Same derivation as a standalone consumer — one source for `data-state` / `data-disabled`.
const indicator = getRadioGroupIndicatorSurface(itemContext)

// Mounts no `Presence` while not shown; see `useLingeringPresence`.
const shown = () => props.forceMount || itemContext.checked.value
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
      v-bind="mergeProps(indicator.attrs.value, $attrs)"
    >
      <slot />
    </component>
  </Presence>
</template>
