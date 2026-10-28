<script lang="ts">
import type {
  Direction,
  Orientation,
} from './utils'
import type { PrimitiveProps } from '@/Primitive'
import { mergeExpose, useForwardElement } from '@/shared'

export interface RovingFocusGroupProps extends PrimitiveProps {
  /**
   * The orientation of the group.
   * Mainly so arrow navigation is done accordingly (left & right vs. up & down)
   */
  orientation?: Orientation
  /**
   * The direction of navigation between items.
   */
  dir?: Direction
  /**
   * Whether keyboard navigation should loop around
   * @defaultValue false
   */
  loop?: boolean
  /** The controlled value of the current stop item. Can be binded as `v-model`. */
  currentTabStopId?: string | null
  /**
   * The value of the current stop item.
   *
   * Use when you do not need to control the state of the stop item.
   */
  defaultCurrentTabStopId?: string
  /**
   * When `true`, will prevent scrolling to the focus item when focused.
   */
  preventScrollOnEntryFocus?: boolean
}

export type RovingFocusGroupEmits = {
  'entryFocus': [event: Event]
  'update:currentTabStopId': [value: string | null | undefined]
}

export { injectRovingFocusGroupContext, provideRovingFocusGroupContext } from './useRovingFocusGroup'
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusGroup } from './useRovingFocusGroup'

defineOptions({
  // `$attrs` are bound first in the template, under the group's own
  // bindings: the precedence the former CollectionSlot wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<RovingFocusGroupProps>(), {
  loop: false,
  orientation: undefined,
  preventScrollOnEntryFocus: false,
})
const emits = defineEmits<RovingFocusGroupEmits>()

const currentTabStopId = useVModel(props, 'currentTabStopId', emits, {
  defaultValue: props.defaultCurrentTabStopId,
  passive: (props.currentTabStopId === undefined) as false,
})

const { forwardRef, currentElement, expose } = useForwardElement()
// The group itself is the composable; this component only renders its element.
const roving = useRovingFocusGroup({
  element: currentElement,
  orientation: () => props.orientation,
  dir: () => props.dir,
  loop: () => props.loop,
  currentTabStopId,
  preventScrollOnEntryFocus: () => props.preventScrollOnEntryFocus,
  onEntryFocus: event => emits('entryFocus', event),
})
defineExpose(mergeExpose(expose, {
  getItems: roving.getItems,
}))
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps($attrs, roving.attrs())"
  >
    <slot />
  </component>
</template>
