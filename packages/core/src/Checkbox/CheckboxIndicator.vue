<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface CheckboxIndicatorProps extends PrimitiveProps {
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
import { injectCheckboxRootContext } from './CheckboxRoot.vue'
import { getCheckboxIndicatorSurface } from './useCheckbox'
import { isIndeterminate } from './utils'

const props = withDefaults(defineProps<CheckboxIndicatorProps>(), {
  as: 'span',
})
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectCheckboxRootContext()
// Same derivation as `useCheckbox().indicator` — one source for `data-state` / `data-disabled`.
const indicator = getCheckboxIndicatorSurface(rootContext)

// Mounts no `Presence` while not shown; see `useLingeringPresence`.
const shown = () => props.forceMount || isIndeterminate(rootContext.state.value) || rootContext.state.value === true
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
      :style="{ pointerEvents: 'none' }"
      v-bind="mergeProps(indicator.attrs.value, $attrs)"
    >
      <slot />
    </component>
  </Presence>
</template>
