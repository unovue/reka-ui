<script lang="ts">
import type { PopperContentProps } from '@/Popper'
import type { PrimitiveProps } from '@/Primitive'
import { defu } from 'defu'
import { containsComposed, useAncestorScroll, useForwardElement } from '@/shared'
import { injectTooltipProviderContext } from './TooltipProvider.vue'

export type TooltipContentImplEmits = {
  /** Event handler called when focus moves to the destructive action after opening. It can be prevented by calling `event.preventDefault` */
  escapeKeyDown: [event: KeyboardEvent]
  /** Event handler called when a pointer event occurs outside the bounds of the component. It can be prevented by calling `event.preventDefault`. */
  pointerDownOutside: [event: Event]
}

export interface TooltipContentImplProps
  extends PrimitiveProps,
  Pick<
    PopperContentProps,
    | 'side'
    | 'sideOffset'
    | 'align'
    | 'alignOffset'
    | 'avoidCollisions'
    | 'collisionBoundary'
    | 'collisionPadding'
    | 'arrowPadding'
    | 'sticky'
    | 'hideWhenDetached'
    | 'positionStrategy'
    | 'updatePositionStrategy'
  > {
  /**
   * By default, screenreaders will announce the content inside
   * the component. If this is not descriptive enough, or you have
   * content that cannot be announced, use aria-label as a more
   * descriptive label.
   *
   * @defaultValue String
   */
  ariaLabel?: string
}
</script>

<script setup lang="ts">
import type { DismissableLayerDismissDetails, FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import { useEventListener } from '@vueuse/core'
import { computed, getCurrentInstance, mergeProps, onMounted } from 'vue'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { PopperContent } from '@/Popper'
import { splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectTooltipRootContext } from './TooltipRoot.vue'
import { getTooltipContentSurface, getTooltipLabelSurface } from './useTooltip'
import { TOOLTIP_OPEN } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TooltipContentImplProps>(), {
  avoidCollisions: undefined,
  asChild: undefined,
  hideWhenDetached: undefined,
})

const emits = defineEmits<TooltipContentImplEmits>()

const CONTENT_STYLE = {
  '--reka-tooltip-content-transform-origin': 'var(--reka-popper-transform-origin)',
  '--reka-tooltip-content-available-width': 'var(--reka-popper-available-width)',
  '--reka-tooltip-content-available-height': 'var(--reka-popper-available-height)',
  '--reka-tooltip-trigger-width': 'var(--reka-popper-anchor-width)',
  '--reka-tooltip-trigger-height': 'var(--reka-popper-anchor-height)',
}

const rootContext = injectTooltipRootContext()
const providerContext = injectTooltipProviderContext()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const ariaLabel = computed(() => props.ariaLabel || currentElement.value?.textContent)

// data-state / data-delayed on the content and id / role="tooltip" on the
// hidden label come from the shared surface builders (single source with
// `useTooltip()`); the PopperContent positioning, the CSS variables, the
// DismissableLayer wrapper and the scroll / TOOLTIP_OPEN listeners stay here.
// `$attrs` and the positioning props merge AFTER the surface, as before, so a
// consumer's explicit `data-state` still wins.
const content = getTooltipContentSurface(rootContext)
const label = getTooltipLabelSurface(rootContext)

const popperContentProps = computed(() => {
  const { ariaLabel: _, ...restProps } = props

  return defu(restProps, providerContext.content.value ?? {}, {
    side: 'top',
    sideOffset: 0,
    align: 'center',
    avoidCollisions: true,
    collisionBoundary: [],
    collisionPadding: 0,
    arrowPadding: 0,
    sticky: 'partial',
    hideWhenDetached: false,
  } satisfies TooltipContentImplProps)
})

// Close the tooltip if the trigger is scrolled (also inside a shadow root)
useAncestorScroll(rootContext.trigger, () => rootContext.onClose())

onMounted(() => {
  // Close this tooltip if another one opens
  useEventListener(document, TOOLTIP_OPEN, () => rootContext.onClose())
})

// `focusOutside` is prevented below, so the layer only dismisses for
// `escape-key` / `outside-press`; the guard keeps `TooltipOpenChangeReason` honest.
function handleDismiss({ reason, event }: DismissableLayerDismissDetails) {
  if (reason === 'focus-outside')
    return
  rootContext.onClose(reason, event)
}

// The content was `<DismissableLayer as-child>` around `PopperContent`; the
// layer is a composable on its element now. `layerWrapper` is what the layer
// received: its bindings with the content's attrs fallen through over them.
// So consumer attrs named after its props and events still configure it,
// and never render. (`$attrs` read through the instance proxy tracks.)
const instance = getCurrentInstance()!
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps({
  asChild: true,
  disableOutsidePointerEvents: false,
  onEscapeKeyDown: (event: KeyboardEvent) => emits('escapeKeyDown', event),
  onPointerDownOutside: (event: PointerDownOutsideEvent) => {
    const trigger = rootContext.trigger.value
    if (rootContext.disableClosingTrigger.value && trigger && containsComposed(trigger, event.target as Node))
      event.preventDefault()

    emits('pointerDownOutside', event)
  },
  onFocusOutside: (event: FocusOutsideEvent) => event.preventDefault(),
  onDismiss: handleDismiss,
}, instance.proxy!.$attrs), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(currentElement, () => layerWrapper.value))
</script>

<template>
  <PopperContent
    :ref="forwardRef"
    v-bind="mergeProps(mergeProps(layer.attrs(), layerWrapper.rest), mergeProps(content.attrs.value, { ...$attrs, ...popperContentProps }, { style: CONTENT_STYLE }))"
  >
    <slot />
    <VisuallyHidden v-bind="label.attrs.value">
      {{ ariaLabel }}
    </VisuallyHidden>
  </PopperContent>
</template>
