<script lang="ts">
import type { Ref } from 'vue'
import type { DismissableLayerDismissDetails, DismissableLayerDismissReason, DismissableLayerProps, FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { PopperContentProps } from '@/Popper'
import type { AcceptableValue } from '@/shared/types'
import { useCollection, useCollectionSlot } from '@/Collection'
import {
  createContext,
  useFocusGuards,
  useForwardElement,
  useForwardProps,
  useHideOthers,
} from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'

export interface SelectContentContext {
  content?: Ref<HTMLElement | undefined>
  viewport?: Ref<HTMLElement | undefined>
  onViewportChange: (node: HTMLElement | undefined) => void
  itemRefCallback: (
    node: HTMLElement | undefined,
    value: AcceptableValue,
    disabled: boolean,
  ) => void
  selectedItem?: Ref<HTMLElement | undefined>
  onItemLeave?: () => void
  itemTextRefCallback: (
    node: HTMLElement | undefined,
    value: AcceptableValue,
    disabled: boolean,
  ) => void
  focusSelectedItem?: () => void
  selectedItemText?: Ref<HTMLElement | undefined>
  position?: 'item-aligned' | 'popper'
  isPositioned?: Ref<boolean>
  searchRef?: Ref<string>
  /**
   * Set by `SelectVirtualizer`: handles a content keydown whose target row may
   * not be rendered (typeahead, Home/End, a looping move at the list's end).
   * Returns `true` when it handled the key.
   */
  onVirtualKeydown?: (event: KeyboardEvent, intent: string | null | undefined) => boolean
  /** Whether keyboard navigation loops (the content's `loop`). */
  loop?: () => boolean
  /**
   * Set while a closed content renders its items into a detached fragment only
   * to read their labels (see `SelectClosedItems`): the items render lean, with
   * no listeners, selection state or indicators, and stay live while closed.
   */
  harvest?: boolean
}

export const SelectContentDefaultContextValue: SelectContentContext = {
  onViewportChange: () => {},
  itemTextRefCallback: () => {},
  itemRefCallback: () => {},
}

/** The content context of the closed content's detached items. */
export const SelectContentHarvestContextValue: SelectContentContext = {
  ...SelectContentDefaultContextValue,
  harvest: true,
}

export type SelectContentImplEmits = {
  closeAutoFocus: [event: Event]
  /**
   * Event handler called when the escape key is down.
   * Can be prevented.
   */
  escapeKeyDown: [event: KeyboardEvent]
  /**
   * Event handler called when a `pointerdown` event happens outside of the `DismissableLayer`.
   * Can be prevented.
   */
  pointerDownOutside: [event: PointerDownOutsideEvent]
}

export interface SelectContentImplProps extends PopperContentProps, DismissableLayerProps {
  /**
   *  The positioning mode to use
   *
   *  `item-aligned (default)` - behaves similarly to a native MacOS menu by positioning content relative to the active item. <br>
   *  `popper` - positions content in the same way as our other primitives, for example `Popover` or `DropdownMenu`.
   */
  position?: 'item-aligned' | 'popper'
  /**
   * When `true`, page scroll is locked while the content is open.
   *
   * @defaultValue true
   */
  bodyLock?: boolean
  /**
   * When `true`, keyboard navigation will loop from last item to first, and vice versa.
   * @defaultValue false
   */
  loop?: boolean
}

export const [injectSelectContentContext, provideSelectContentContext]
  = createContext<SelectContentContext>('SelectContent')
</script>

<script setup lang="ts">
import type { WrapperSpec } from '@/shared/splitWrapperAttrs'
import { reactiveOmit } from '@vueuse/core'
import { computed, getCurrentInstance, mergeProps, watch } from 'vue'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { FOCUS_SCOPE_WRAPPER, focusScopeOptions, useFocusScope } from '@/FocusScope/useFocusScope'
import { PopperContent } from '@/Popper'
import { renderAs } from '@/Primitive/renderAs'
import { createWrapperEmit, splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { injectSelectRootContext } from './SelectRoot.vue'
import { useSelectContent } from './useSelect'
import { useSelectItemAlignedPosition } from './useSelectItemAlignedPosition'
import { CONTENT_MARGIN } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectContentImplProps>(), {
  align: 'start',
  position: 'item-aligned',
  bodyLock: true,
  disableOutsidePointerEvents: true,
})
const emits = defineEmits<SelectContentImplEmits>()

const rootContext = injectSelectRootContext()

// The modal side effects follow the open state, not the mount: a
// `forceMount`ed content that is closed (or animating out) must not keep the
// scroll lock, the internal backdrop or `aria-hidden` on its siblings.
const present = computed(() => rootContext.open.value)

// Modal by default (#2822): page scroll is locked while the content is open,
// and `disableOutsidePointerEvents` mounts the dismissable layer's internal
// backdrop under the content.
const scrollLocked = useBodyScrollLock(present.value && props.bodyLock)
watch([present, () => props.bodyLock], ([isPresent, bodyLock]) => scrollLocked.value = isPresent && bodyLock)
const { getItems } = useCollection()

// The `role="listbox"` element (inside the popper's positioning wrapper).
const { forwardRef, currentElement: content, expose } = useForwardElement()
defineExpose(expose)
useCollectionSlot(content)
// Scope focus guards to the content's root (shadow-safe).
useFocusGuards(content)
useHideOthers(computed(() => present.value ? content.value : undefined))

// In `popper` position the trigger stays visible beside the content: cut it
// out of the backdrop so a press on it toggles the select closed (Base UI).
const backdropCutout = computed(() => props.position === 'popper' ? rootContext.triggerElement.value : undefined)

// `focus-outside` is prevented below, so a dismissal is only ever an Escape
// key or an outside press.
function handleDismiss({ reason, event }: DismissableLayerDismissDetails) {
  rootContext.onOpenChange(false, reason as Exclude<DismissableLayerDismissReason, 'focus-outside'>, event)
}

function handlePointerDownOutside(event: PointerDownOutsideEvent) {
  emits('pointerDownOutside', event)
  if (event.defaultPrevented)
    return
  // A press on the trigger toggles the select closed: report it as a
  // `'trigger-press'`, not a dismissal.
  const target = event.target as Node | null
  if (target && rootContext.triggerElement.value?.contains(target)) {
    event.preventDefault()
    rootContext.onOpenChange(false, 'trigger-press', event.detail.originalEvent)
  }
}

// Keyboard navigation and typeahead, the selected-item tracking for
// item-aligned positioning, and the pointer-release guard after opening.
const { content: surface, contentContext, isPositioned } = useSelectContent({
  context: rootContext,
  contentElement: content as unknown as Ref<HTMLElement | undefined>,
  getItems,
  position: props.position,
  loop: () => props.loop,
})

provideSelectContentContext(contentContext)

// `loop` drives keyboard navigation here and is not a positioning prop.
// Item-aligned, the content renders its own element (`as` / `asChild`).
const positionProps = reactiveOmit(props, 'loop')
const forwardedProps = useForwardProps(computed(() => props.position === 'popper' ? positionProps : {}))

// The content was `<CollectionSlot>` around `<FocusScope as-child>` around
// `<DismissableLayer as-child>` around `SelectPopperPosition` (a
// `PopperContent`) or `SelectItemAlignedPosition` (a wrapper and the
// element); they are composables and the content's own render now. Each
// `*Wrapper` is what that component received, merged as the template merged
// it: the content's attrs reached the root `FocusScope` under its bindings,
// and each as-child slot merged what its component rendered under the next
// one's bindings. So consumer attrs named after their props and events still
// configure them and never render. (`$attrs` read through the instance proxy
// tracks.) The attrs are bound once: the content also bound them on the
// positioning part, so a consumer listener on the content ran twice.
const instance = getCurrentInstance()!
const focusScopeWrapper = computed(() => splitWrapperAttrs(mergeProps(instance.proxy!.$attrs, {
  asChild: true,
  present: present.value,
  onMountAutoFocus: (event: Event) => event.preventDefault(),
  onUnmountAutoFocus: (event: Event) => {
    emits('closeAutoFocus', event)
    if (event.defaultPrevented)
      return
    rootContext.triggerElement.value?.focus({ preventScroll: true })
    event.preventDefault()
  },
}), FOCUS_SCOPE_WRAPPER))
const scope = useFocusScope(focusScopeOptions(content, () => focusScopeWrapper.value))
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps(mergeProps(scope.attrs(), focusScopeWrapper.value.rest), {
  asChild: true,
  present: present.value,
  disableOutsidePointerEvents: props.disableOutsidePointerEvents,
  backdropCutout: backdropCutout.value,
  onFocusOutside: (event: FocusOutsideEvent) => event.preventDefault(),
  onDismiss: handleDismiss,
  onEscapeKeyDown: (event: KeyboardEvent) => emits('escapeKeyDown', event),
  onPointerDownOutside: handlePointerDownOutside,
}), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(content, () => layerWrapper.value))

// What the positioning part received.
const positionAttrs = computed(() => mergeProps(layer.attrs(), layerWrapper.value.rest, forwardedProps.value, surface.attrs.value))

// Popper: `SelectPopperPosition`'s defaults and CSS variables.
const popperStyle = {
  // Ensure border-box for floating-ui calculations
  'boxSizing': 'border-box',
  '--reka-select-content-transform-origin':
    'var(--reka-popper-transform-origin)',
  '--reka-select-content-available-width':
    'var(--reka-popper-available-width)',
  '--reka-select-content-available-height':
    'var(--reka-popper-available-height)',
  '--reka-select-trigger-width': 'var(--reka-popper-anchor-width)',
  '--reka-select-trigger-height': 'var(--reka-popper-anchor-height)',
}

// Item-aligned: a consumer's `placed` listener was `SelectItemAlignedPosition`'s.
const ITEM_ALIGNED_WRAPPER: WrapperSpec = { props: {}, emits: ['placed'] }
const itemAlignedWrapper = computed(() => splitWrapperAttrs(positionAttrs.value, ITEM_ALIGNED_WRAPPER))
const emitItemAligned = createWrapperEmit(() => itemAlignedWrapper.value)
const itemAligned = useSelectItemAlignedPosition({
  rootContext,
  contentContext,
  contentElement: content,
  getItems,
  enabled: () => props.position !== 'popper',
  onPlaced: () => {
    emitItemAligned('onPlaced')
    isPositioned.value = true
  },
})
const itemAlignedWrapperElement = itemAligned.wrapper
const itemAlignedStyle = {
  // When we get the height of the content, it includes borders. If we were to set
  // the height without having `boxSizing: 'border-box'` it would be too big.
  boxSizing: 'border-box',
  // We need to ensure the content doesn't get taller than the wrapper
  maxHeight: '100%',
}
</script>

<template>
  <PopperContent
    v-if="position === 'popper'"
    :ref="forwardRef"
    v-bind="mergeProps({ collisionPadding: CONTENT_MARGIN, style: popperStyle }, positionAttrs)"
    @placed="isPositioned = true"
  >
    <slot />
  </PopperContent>
  <div
    v-else
    ref="itemAlignedWrapperElement"
    :style="{
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      zIndex: itemAligned.zIndex.value,
    }"
  >
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      v-bind="mergeProps({ style: itemAlignedStyle }, itemAlignedWrapper.rest)"
    >
      <slot />
    </component>
  </div>
</template>
