<script lang="ts">
import type { Ref } from 'vue'

import type { NavigationMenuChangeReason } from './useNavigationMenu'
import type { Direction, Orientation } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { useCollection } from '@/Collection'
import { createContext, useDirection, useForwardElement, useId } from '@/shared'
import { EVENT_ROOT_CONTENT_DISMISS } from './utils'

export interface NavigationMenuRootProps extends PrimitiveProps {
  /** The controlled value of the menu item to activate. Can be used as `v-model`. */
  modelValue?: string
  /**
   * The value of the menu item that should be active when initially rendered.
   *
   * Use when you do not need to control the value state.
   */
  defaultValue?: string
  /**
   * The reading direction of the combobox when applicable.
   *
   *  If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /** The orientation of the menu. */
  orientation?: Orientation
  /**
   * The duration from when the pointer enters the trigger until the tooltip gets opened.
   * @defaultValue 200
   */
  delayDuration?: number
  /**
   * How much time a user has to enter another trigger without incurring a delay again.
   * @defaultValue 300
   */
  skipDelayDuration?: number

  /**
   * If `true`, menu cannot be open by click on trigger
   * @defaultValue false
   */
  disableClickTrigger?: boolean
  /**
   * If `true`, menu cannot be open by hover on trigger
   * @defaultValue false
   */
  disableHoverTrigger?: boolean
  /**
   * If `true`, menu will not close during pointer leave event
   * @defaultValue false
   */
  disablePointerLeaveClose?: boolean

  /**
   * When `true`, the element will be unmounted on closed state.
   *
   * @defaultValue `true`
   */
  unmountOnHide?: boolean
}
export type NavigationMenuRootEmits = {
  /** Called before the value changes; `details.cancel()` keeps the current value. */
  'beforeUpdate:modelValue': [value: string, details: ChangeEventDetails<NavigationMenuChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [value: string, details: ChangeEventDetails<NavigationMenuChangeReason>]
  /** Event handler called after the viewport's open (`true`) or close (`false`) transitions and animations have finished. Requires a `NavigationMenuViewport`. */
  'update:openComplete': [value: boolean]
}

export interface NavigationMenuContext {
  isRootMenu: boolean
  modelValue: Readonly<Ref<string>>
  previousValue: Ref<string>
  baseId: string
  dir: Readonly<Ref<Direction>>
  orientation: Orientation
  disableClickTrigger: Readonly<Ref<boolean>>
  disableHoverTrigger: Readonly<Ref<boolean>>
  unmountOnHide: Readonly<Ref<boolean>>
  rootNavigationMenu: Ref<HTMLElement | undefined>
  activeTrigger: Ref<HTMLElement | undefined>
  indicatorTrack: Ref<HTMLElement | undefined>
  onIndicatorTrackChange: (indicatorTrack: HTMLElement | undefined) => void
  viewport: Ref<HTMLElement | undefined>
  onViewportChange: (viewport: HTMLElement | undefined) => void
  onTriggerEnter: (itemValue: string, event?: Event) => void
  onTriggerLeave: (event?: Event) => void
  onContentEnter: (itemValue: string) => void
  onContentLeave: (event?: Event) => void
  /** Opens `itemValue` (`''` closes) at once. Returns `false` when unchanged or cancelled via `beforeUpdate:modelValue`. */
  onItemSelect: (itemValue: string, reason?: NavigationMenuChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Closes the menu at once. Returns `false` when unchanged or cancelled via `beforeUpdate:modelValue`. */
  onItemDismiss: (reason?: NavigationMenuChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Called by the viewport once its open/close transitions finish; emits `update:openComplete`. */
  notifyOpenComplete?: (value: boolean) => void
}

export const [injectNavigationMenuContext, provideNavigationMenuContext]
  = createContext<NavigationMenuContext>(['NavigationMenuRoot', 'NavigationMenuSub'], 'NavigationMenuContext')
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { Primitive } from '@/Primitive'
import { handleRootDismissEvent, useNavigationMenu } from './useNavigationMenu'

const props = withDefaults(defineProps<NavigationMenuRootProps>(), {
  modelValue: undefined,
  delayDuration: 200,
  skipDelayDuration: 300,
  orientation: 'horizontal',
  disableClickTrigger: false,
  disableHoverTrigger: false,
  unmountOnHide: true,
  as: 'nav',
})
const emits = defineEmits<NavigationMenuRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { forwardRef, currentElement: rootNavigationMenu, expose } = useForwardElement()
defineExpose(expose)

const { getItems, CollectionSlot } = useCollection({ key: 'NavigationMenu', isProvider: true })

// `useDirection` (ConfigProvider-aware) and `useId` (SSR-aware) stay in the
// shell; the open-item model, hover intent and context live in the composable.
const dir = useDirection(() => props.dir)

const { modelValue, root, context } = useNavigationMenu({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  dir,
  orientation: props.orientation,
  delayDuration: () => props.delayDuration,
  skipDelayDuration: () => props.skipDelayDuration,
  disableClickTrigger: () => props.disableClickTrigger,
  disableHoverTrigger: () => props.disableHoverTrigger,
  disablePointerLeaveClose: () => props.disablePointerLeaveClose,
  unmountOnHide: () => props.unmountOnHide,
  baseId: useId(undefined, 'reka-navigation-menu'),
  rootElement: rootNavigationMenu as Ref<HTMLElement | undefined>,
  getItems: () => getItems().map(i => i.ref),
  emit: emits,
  onOpenComplete: value => emits('update:openComplete', value),
})

useEventListener(rootNavigationMenu, EVENT_ROOT_CONTENT_DISMISS, (event: Event) => handleRootDismissEvent(context, event))

provideNavigationMenuContext(context)
</script>

<template>
  <CollectionSlot>
    <Primitive
      v-bind="root.attrs.value"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
    >
      <slot :model-value="modelValue" />
    </Primitive>
  </CollectionSlot>
</template>
