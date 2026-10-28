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
import { getCurrentInstance, ref, shallowRef } from 'vue'
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { isIndeterminate } from './utils'

withDefaults(defineProps<MenuItemIndicatorProps>(), {
  as: 'span',
})

const indicatorContext = injectMenuItemIndicatorContext({
  modelValue: ref(false),
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// An indicator that is not shown mounts no `Presence` (Base UI's
// `SelectItemIndicator` returns `null`). Once shown, it stays mounted until its
// exit has finished, and one shown after this indicator mounted enters with
// `data-starting-style`, as it did while `Presence` was always mounted.
const instance = getCurrentInstance()!
const lingering = shallowRef(false)
function onPresenceComplete(present: boolean) {
  if (!present)
    lingering.value = false
}
</script>

<template>
  <Presence
    v-if="forceMount || isIndeterminate(indicatorContext.modelValue.value) || indicatorContext.modelValue.value === true || lingering"
    :ref="forwardRef"
    :present="forceMount || isIndeterminate(indicatorContext.modelValue.value) || indicatorContext.modelValue.value === true"
    :appear="instance.isMounted"
    @vue:mounted="lingering = true"
    @complete="onPresenceComplete"
  >
    <Primitive
      :as="as"
      :as-child="asChild"
      :data-state="selectionState(indicatorContext.modelValue.value)"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
