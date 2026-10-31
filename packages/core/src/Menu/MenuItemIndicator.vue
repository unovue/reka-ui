<script lang="ts">
import type { Ref } from 'vue'
import type { CheckedState } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, selectionState, useForwardElement } from '@/shared'

interface MenuItemIndicatorContext {
  modelValue: Ref<CheckedState>
}

export interface MenuItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}

export const [injectMenuItemIndicatorContext, provideMenuItemIndicatorContext]
  = createContext<MenuItemIndicatorContext>(
    ['MenuCheckboxItem', 'MenuRadioItem'],
    'MenuItemIndicatorContext',
  )
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Presence } from '@/Presence'
import { renderAs } from '@/Primitive/renderAs'
import { useLingeringPresence } from '@/shared/useLingeringPresence'
import { isIndeterminate } from './utils'

const props = withDefaults(defineProps<MenuItemIndicatorProps>(), {
  as: 'span',
})

const indicatorContext = injectMenuItemIndicatorContext({
  modelValue: ref(false),
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// Mounts no `Presence` while not shown; see `useLingeringPresence`.
const shown = () => props.forceMount || isIndeterminate(indicatorContext.modelValue.value) || indicatorContext.modelValue.value === true
const lingering = useLingeringPresence(shown)
</script>

<template>
  <Presence
    v-if="lingering.mounted()"
    :ref="forwardRef"
    :present="shown()"
    :appear="lingering.appear()"
    @vue:mounted="lingering.onMounted"
    @complete="lingering.onComplete"
  >
    <component
      :is="renderAs(as, asChild)"
      :data-state="selectionState(indicatorContext.modelValue.value)"
    >
      <slot />
    </component>
  </Presence>
</template>
