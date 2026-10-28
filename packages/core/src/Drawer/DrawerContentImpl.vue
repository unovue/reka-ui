<script lang="ts">
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
} from '@/DismissableLayer'

export type DrawerContentImplEmits = DismissableLayerEmits & {
  openAutoFocus: [event: Event]
  closeAutoFocus: [event: Event]
}

export interface DrawerContentImplProps extends DismissableLayerProps {
  trapFocus?: boolean
  /**
   * Initial focus target when the drawer opens.
   * - `true` / default: focus the first focusable element inside
   * - `false`: do not focus anything
   * - element ref: focus that specific element
   */
  initialFocus?: boolean | HTMLElement | null
  /**
   * Final focus target when the drawer closes.
   * - `true` / default: focus the trigger
   * - `false`: do not restore focus
   * - element ref: focus that specific element
   */
  finalFocus?: boolean | HTMLElement | null
}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, mergeProps } from 'vue'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { FOCUS_SCOPE_WRAPPER, focusScopeOptions, useFocusScope } from '@/FocusScope/useFocusScope'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { useDrawerContent } from './useDrawer'
import { registerDrawerCssProperties } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DrawerContentImplProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerContentImplEmits>()

const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

registerDrawerCssProperties()

// Snap points, swipe dismiss, dismiss reasons and the
// nested-drawer CSS vars live in the composable; the focus scope and the
// dismissable layer stay here. `$attrs` merges AFTER the surface (consumer attrs win, handlers chain).
const {
  content,
  onDismiss,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  onMountAutoFocus,
} = useDrawerContent({
  rootContext,
  contentElement: currentElement,
  initialFocus: () => props.initialFocus,
  onEscapeKeyDown: event => emits('escapeKeyDown', event),
  onPointerDownOutside: event => emits('pointerDownOutside', event),
  onFocusOutside: event => emits('focusOutside', event),
  onInteractOutside: event => emits('interactOutside', event),
  onOpenAutoFocus: event => emits('openAutoFocus', event),
})

// The content was `<FocusScope as-child>` around a `<DismissableLayer>` that
// rendered its element; both are composables on that element now. Each
// `*Wrapper` is what that component received, merged as the template merged
// it: the content's attrs fell through over the root `FocusScope`'s bindings,
// and its as-child slot merged what it rendered under the layer's. So
// consumer attrs named after their props and events still configure them,
// and never render. (`$attrs` read through the instance proxy tracks.)
const instance = getCurrentInstance()!
const focusScopeWrapper = computed(() => splitWrapperAttrs(mergeProps({
  asChild: true,
  loop: true,
  trapped: props.trapFocus,
  onMountAutoFocus,
  onUnmountAutoFocus: (event: Event) => emits('closeAutoFocus', event),
}, instance.proxy!.$attrs), FOCUS_SCOPE_WRAPPER))
const scope = useFocusScope(focusScopeOptions(currentElement, () => focusScopeWrapper.value))
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps(mergeProps(scope.attrs(), focusScopeWrapper.value.rest), mergeProps({
  as: props.as,
  asChild: props.asChild,
  disableOutsidePointerEvents: props.disableOutsidePointerEvents,
}, mergeProps(content.attrs.value, instance.proxy!.$attrs), {
  onDismiss,
  onEscapeKeyDown,
  onFocusOutside,
  onInteractOutside,
  onPointerDownOutside,
})), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(currentElement, () => layerWrapper.value))
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps(layer.attrs(), layerWrapper.rest)"
  >
    <slot />
  </component>
</template>
