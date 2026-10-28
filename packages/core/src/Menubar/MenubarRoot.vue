<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from '../shared/types'
import type { MenubarChangeReason } from './useMenubar'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { useCollection, useCollectionSlot } from '@/Collection'
import { createContext, useDirection, useForwardElement } from '@/shared'

export interface MenubarRootProps extends PrimitiveProps {
  /** The controlled value of the menu to open. Can be used as `v-model`. */
  modelValue?: string
  /** The value of the menu that should be open when initially rendered. Use when you do not need to control the value state. */
  defaultValue?: string
  /**
   * The reading direction of the combobox when applicable.
   *
   *  If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /** When `true`, keyboard navigation will loop from last item to first, and vice versa. */
  loop?: boolean
}
export type MenubarRootEmits = {
  /** Called before the value changes; `details.cancel()` keeps the current value. */
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<MenubarChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [value: string, details: ChangeEventDetails<MenubarChangeReason>]
}

export interface MenubarRootContext {
  modelValue: Readonly<Ref<string>>
  dir: Ref<Direction>
  loop: Ref<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:modelValue`. */
  onMenuOpen: (value: string, reason?: MenubarChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:modelValue`. */
  onMenuClose: (reason?: MenubarChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:modelValue`. */
  onMenuToggle: (value: string, reason?: MenubarChangeReason | BaseChangeReason, event?: Event) => boolean
}

export const [injectMenubarRootContext, provideMenubarRootContext]
  = createContext<MenubarRootContext>('MenubarRoot')
</script>

<script setup lang="ts">
import { mergeProps, toRefs } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusGroup } from '@/RovingFocus/useRovingFocusGroup'
import { useMenubar } from './useMenubar'

defineOptions({
  // `$attrs` are merged under the roving and root bindings: the precedence
  // the former `CollectionSlot` / `<RovingFocusGroup as-child>` wrappers gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<MenubarRootProps>(), {
  loop: false,
  as: 'div',
})
const emit = defineEmits<MenubarRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
useCollection({ key: 'Menubar', isProvider: true })
useCollectionSlot(currentElement, { key: 'Menubar' })

// The composable owns the open-menu model: every open, close and switch goes
// through one `setState`, so `beforeUpdate:modelValue` can cancel it.
// `useDirection` (ConfigProvider-aware) stays in the shell.
const { dir: propDir, loop } = toRefs(props)
const dir = useDirection(propDir)

const { modelValue, currentTabStopId, root, context } = useMenubar({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  dir,
  loop,
  emit,
})

provideMenubarRootContext(context)

// Arrow-key navigation between the triggers. The former
// `<RovingFocusGroup as-child>` sat under a `CollectionSlot`, whose slot
// merged the consumer's attrs under the group's own bindings: Menubar's
// orientation, dir, loop and tab stop win, and consumer listeners run first.
const roving = useRovingFocusGroup({
  consumerAttrs: 'under',
  element: currentElement,
  orientation: () => 'horizontal',
  dir: () => dir.value,
  loop: () => loop.value,
  currentTabStopId,
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps(roving.consumerAttrs($attrs), roving.attrs(), root.attrs.value)"
  >
    <slot :model-value="modelValue" />
  </component>
</template>
