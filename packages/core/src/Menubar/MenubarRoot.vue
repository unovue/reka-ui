<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from '../shared/types'
import type { MenubarChangeReason } from './useMenubar'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { useCollection } from '@/Collection'
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
import { toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusGroup } from '@/RovingFocus'
import { useMenubar } from './useMenubar'

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

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const { CollectionSlot } = useCollection({ key: 'Menubar', isProvider: true })

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
</script>

<template>
  <CollectionSlot>
    <RovingFocusGroup
      v-model:current-tab-stop-id="currentTabStopId"
      orientation="horizontal"
      :loop="loop"
      :dir="dir"
      as-child
    >
      <Primitive
        :ref="forwardRef"
        v-bind="root.attrs.value"
        :as="as"
        :as-child="asChild"
      >
        <slot :model-value="modelValue" />
      </Primitive>
    </RovingFocusGroup>
  </CollectionSlot>
</template>
