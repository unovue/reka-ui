<script lang="ts">
import type {
  DismissableLayerDismissDetails,
  DismissableLayerEmits,
  DismissableLayerProps,
  FocusOutsideEvent,
  PointerDownOutsideEvent,
} from '@/DismissableLayer'
import { getActiveElement, useForwardElement } from '@/shared'

export type DialogContentImplEmits = DismissableLayerEmits & {
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

export interface DialogContentImplProps extends DismissableLayerProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling transition with Vue native transition or other animation libraries.
   */
  forceMount?: boolean
  /**
   * When `true`, focus cannot escape the `Content` via keyboard,
   * pointer, or a programmatic focus.
   * @defaultValue false
   */
  trapFocus?: boolean
}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, mergeProps, onMounted, watch } from 'vue'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { FOCUS_SCOPE_WRAPPER, focusScopeOptions, useFocusScope } from '@/FocusScope/useFocusScope'
import { renderAs } from '@/Primitive/renderAs'
import { splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogContentSurface } from './useDialog'
import { endFocusRecord, recordFocusBeforeOpen, useWarning } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DialogContentImplProps & {
  /** Whether the content is currently visible. Forwarded to `FocusScope` and
   * `DismissableLayer` so a force-mounted dialog (`unmountOnHide: false`)
   * auto-focuses on show and leaves the layer/scope stacks while hidden. */
  present?: boolean
}>()
const emits = defineEmits<DialogContentImplEmits>()

const rootContext = injectDialogRootContext()
const { forwardRef, currentElement: contentElement, expose } = useForwardElement()
defineExpose(expose)

// id/role/aria-labelledby/aria-describedby/data-state come from the shared
// surface builder (single source with `useDialog()`); the focus scope, the
// dismissable layer, `dismiss` forwarding and the a11y warnings stay here.
// `$attrs` merges AFTER the surface so a consumer's
// `:aria-describedby="undefined"` still wins.
const content = getDialogContentSurface(rootContext)

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
  present: props.present,
  onMountAutoFocus: (event: Event) => emits('openAutoFocus', event),
  onUnmountAutoFocus: (event: Event) => emits('closeAutoFocus', event),
}, instance.proxy!.$attrs), FOCUS_SCOPE_WRAPPER))
const scope = useFocusScope(focusScopeOptions(contentElement, () => focusScopeWrapper.value))
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps(mergeProps(scope.attrs(), focusScopeWrapper.value.rest), mergeProps({
  as: props.as,
  asChild: props.asChild,
  present: props.present,
  disableOutsidePointerEvents: props.disableOutsidePointerEvents,
}, mergeProps(content.attrs.value, instance.proxy!.$attrs), {
  onDismiss: (details: DismissableLayerDismissDetails) => rootContext.onOpenChange(false, details.reason, details.event),
  onEscapeKeyDown: (event: KeyboardEvent) => emits('escapeKeyDown', event),
  onFocusOutside: (event: FocusOutsideEvent) => emits('focusOutside', event),
  onInteractOutside: (event: PointerDownOutsideEvent | FocusOutsideEvent) => emits('interactOutside', event),
  onPointerDownOutside: (event: PointerDownOutsideEvent) => emits('pointerDownOutside', event),
})), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(contentElement, () => layerWrapper.value))

onMounted(() => {
  rootContext.contentElement = contentElement
})

// Record where focus was on every open, before the content moves it: a
// content kept mounted (`unmountOnHide: false`) sets up only once. The
// trigger ref is left alone, so it stays the fallback (Base UI `finalFocus`).
watch(() => rootContext.open.value, (open) => {
  // `typeof document`: the immediate run also happens during SSR.
  if (open && typeof document !== 'undefined')
    recordFocusBeforeOpen(rootContext, getActiveElement(), contentElement.value)
  else if (!open)
    endFocusRecord(rootContext)
}, { immediate: true, flush: 'sync' })

if (process.env.NODE_ENV !== 'production') {
  useWarning({
    titleName: 'DialogTitle',
    contentName: 'DialogContent',
    componentLink: 'dialog.html#title',
    // Read on mount: a `DialogTitle` / `DialogDescription` `id` replaces them at setup.
    titleId: () => rootContext.titleId,
    descriptionId: () => rootContext.descriptionId,
    contentElement,
  })
}
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
