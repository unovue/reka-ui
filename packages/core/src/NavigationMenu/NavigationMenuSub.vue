<script lang="ts">
import type { NavigationMenuChangeReason } from './useNavigationMenu'
import type { Orientation } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import { useCollection } from '@/Collection'

export type NavigationMenuSubEmits = {
  /** Called before the value changes; `details.cancel()` keeps the current value. */
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<NavigationMenuChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [value: string, details: ChangeEventDetails<NavigationMenuChangeReason>]
}

export interface NavigationMenuSubProps extends PrimitiveProps {
  /** The controlled value of the sub menu item to activate. Can be used as `v-model`. */
  modelValue?: string
  /**
   * The value of the menu item that should be active when initially rendered.
   *
   * Use when you do not need to control the value state.
   */
  defaultValue?: string
  /** The orientation of the menu. */
  orientation?: Orientation
}
</script>

<script setup lang="ts">
import type { Ref } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectNavigationMenuContext, provideNavigationMenuContext } from './NavigationMenuRoot.vue'
import { useNavigationMenuSub } from './useNavigationMenu'

const props = withDefaults(defineProps<NavigationMenuSubProps>(), {
  modelValue: undefined,
  orientation: 'horizontal',
})
const emits = defineEmits<NavigationMenuSubEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const menuContext = injectNavigationMenuContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const { getItems, CollectionSlot } = useCollection({ key: 'NavigationMenu', isProvider: true })

const { modelValue, root, context } = useNavigationMenuSub({
  parentContext: menuContext,
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  orientation: props.orientation,
  rootElement: currentElement as Ref<HTMLElement | undefined>,
  getItems: () => getItems().map(i => i.ref),
  emit: emits,
})

provideNavigationMenuContext(context)
</script>

<template>
  <CollectionSlot>
    <Primitive
      v-bind="root.attrs.value"
      :ref="forwardRef"
      :as-child="props.asChild"
      :as="as"
    >
      <slot :model-value="modelValue" />
    </Primitive>
  </CollectionSlot>
</template>
