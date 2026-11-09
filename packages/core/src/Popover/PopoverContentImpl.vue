<script lang="ts">
import type {
  DismissableLayerDismissDetails,
  DismissableLayerEmits,
  DismissableLayerProps,
  FocusOutsideEvent,
  PointerDownOutsideEvent,
} from '@/DismissableLayer'
import type { FocusScopeProps } from '@/FocusScope'
import type { PopperContentProps } from '@/Popper'
import { reactiveOmit } from '@vueuse/shared'

export type PopoverContentImplEmits = DismissableLayerEmits & {
  /**
   * Event handler called when auto-focusing on open.
   * Can be prevented.
   */
  openAutoFocus: [event: Event]
  /**
   * Event handler called when auto-focusing on close.
   * Can be prevented.
   */
  closeAutoFocus: [event: Event]
}

export interface PopoverContentImplProps extends PopperContentProps, Omit<DismissableLayerProps, 'dir'> {
  /**
   * Id of the element, which the trigger's `aria-controls` points at.
   * Auto-generated when not provided.
   */
  id?: string
}

interface PopoverContentImplPrivateProps extends PopoverContentImplProps {
  /**
   * Whether focus should be trapped within the `MenuContent`
   * @defaultValue false
   */
  trapFocus?: FocusScopeProps['trapped']
  /** Element left interactive through the modal internal backdrop (the trigger). */
  backdropCutout?: HTMLElement | null
}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, mergeProps } from 'vue'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { FOCUS_SCOPE_WRAPPER, focusScopeOptions, useFocusScope } from '@/FocusScope/useFocusScope'
import { PopperContent } from '@/Popper'
import { useFocusGuards, useForwardElement, useForwardProps } from '@/shared'
import { splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { getPopoverContentSurface } from './usePopover'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<PopoverContentImplPrivateProps>()
const emits = defineEmits<PopoverContentImplEmits>()

const forwarded = useForwardProps(reactiveOmit(props, 'trapFocus', 'disableOutsidePointerEvents', 'backdropCutout'))
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectPopoverRootContext()
useFocusGuards(currentElement)

// id/role/aria-labelledby/data-state come from the shared surface builder
// (single source with `usePopover()`); the focus scope, the dismissable layer
// (which hands the dismiss reason + event to `onOpenChange`), PopperContent
// and the `--reka-popover-*` CSS variables stay in the SFC.
const content = getPopoverContentSurface(rootContext)

// The content was `<FocusScope as-child>` around `<DismissableLayer
// as-child>` around `PopperContent`; both wrappers are composables on its
// element now. Each `*Wrapper` is what that component received, merged as the
// template merged it: the content's attrs fell through over the root
// `FocusScope`'s bindings, and each as-child slot merged what its component
// rendered under the next one's bindings. So consumer attrs named after their
// props and events still configure them, and never render. (`$attrs` read
// through the instance proxy tracks.)
const instance = getCurrentInstance()!
const focusScopeWrapper = computed(() => splitWrapperAttrs(mergeProps({
  asChild: true,
  loop: true,
  trapped: props.trapFocus,
  onMountAutoFocus: (event: Event) => emits('openAutoFocus', event),
  onUnmountAutoFocus: (event: Event) => emits('closeAutoFocus', event),
}, instance.proxy!.$attrs), FOCUS_SCOPE_WRAPPER))
const scope = useFocusScope(focusScopeOptions(currentElement, () => focusScopeWrapper.value))
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps(mergeProps(scope.attrs(), focusScopeWrapper.value.rest), {
  asChild: true,
  disableOutsidePointerEvents: props.disableOutsidePointerEvents,
  backdropCutout: props.backdropCutout,
  onPointerDownOutside: (event: PointerDownOutsideEvent) => emits('pointerDownOutside', event),
  onInteractOutside: (event: PointerDownOutsideEvent | FocusOutsideEvent) => emits('interactOutside', event),
  onEscapeKeyDown: (event: KeyboardEvent) => emits('escapeKeyDown', event),
  onFocusOutside: (event: FocusOutsideEvent) => emits('focusOutside', event),
  onDismiss: (details: DismissableLayerDismissDetails) => rootContext.onOpenChange(false, details.reason, details.event),
}), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(currentElement, () => layerWrapper.value))
</script>

<template>
  <PopperContent
    :ref="forwardRef"
    v-bind="mergeProps(layer.attrs(), layerWrapper.rest, forwarded, content.attrs.value, props.id ? { id: props.id } : {})"
    :style="{
      '--reka-popover-content-transform-origin':
        'var(--reka-popper-transform-origin)',
      '--reka-popover-content-available-width':
        'var(--reka-popper-available-width)',
      '--reka-popover-content-available-height':
        'var(--reka-popper-available-height)',
      '--reka-popover-trigger-width': 'var(--reka-popper-anchor-width)',
      '--reka-popover-trigger-height': 'var(--reka-popper-anchor-height)',
    }"
  >
    <slot />
  </PopperContent>
</template>
