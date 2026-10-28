<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface SelectItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { useLingeringPresence } from '@/shared/useLingeringPresence'
import { injectSelectItemContext } from './SelectItem.vue'
import { useSelectItemIndicator } from './useSelect'

const props = withDefaults(defineProps<SelectItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectSelectItemContext()
const { indicator, present } = useSelectItemIndicator(itemContext)

// Mounts no `Presence` while not shown; see `useLingeringPresence`.
const shown = () => props.forceMount || present.value
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
    <Primitive
      :ref="forwardRef"
      v-bind="indicator.attrs.value"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
