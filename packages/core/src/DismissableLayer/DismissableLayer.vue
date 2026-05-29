<script lang="ts">
import type {
  FocusOutsideEvent,
  PointerDownOutsideEvent,
} from './utils'

import type { PrimitiveProps } from '@/Primitive'
import {
  computed,
  nextTick,
  reactive,
  toRaw,
  watchEffect,
} from 'vue'
import { isNullish, useForwardExpose } from '@/shared'

export interface DismissableLayerProps extends PrimitiveProps {
  /**
   * When `true`, hover/focus/click interactions will be disabled on elements outside
   * the `DismissableLayer`. Users will need to click twice on outside elements to
   * interact with them: once to close the `DismissableLayer`, and again to trigger the element.
   */
  disableOutsidePointerEvents?: boolean
}

export type DismissableLayerEmits = {
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
  /**
   * Event handler called when the focus moves outside of the `DismissableLayer`.
   * Can be prevented.
   */
  focusOutside: [ event: FocusOutsideEvent]
  /**
   * Event handler called when an interaction happens outside the `DismissableLayer`.
   * Specifically, when a `pointerdown` event happens outside or focus moves outside of it.
   * Can be prevented.
   */
  interactOutside: [ event: PointerDownOutsideEvent | FocusOutsideEvent]
}

export type DismissableLayerPrivateEmits = DismissableLayerEmits & {
  /**
   * Handler called when the `DismissableLayer` should be dismissed
   */
  dismiss: []
}

export const context = reactive({
  layersRoot: new Set<HTMLElement>(),
  layersWithOutsidePointerEventsDisabled: new Set<HTMLElement>(),
  originalBodyPointerEvents: undefined as string | undefined,
  branches: new Set<HTMLElement>(),
})
</script>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import {
  Primitive,
} from '@/Primitive'
import {
  useFocusOutside,
  usePointerDownOutside,
} from './utils'

const props = withDefaults(defineProps<DismissableLayerProps>(), {
  disableOutsidePointerEvents: false,
})

const emits = defineEmits<DismissableLayerPrivateEmits>()

const { forwardRef, currentElement: layerElement } = useForwardExpose()
const ownerDocument = computed(
  () => layerElement.value?.ownerDocument ?? globalThis.document,
)

const layers = computed(() => context.layersRoot)

const index = computed(() => {
  return layerElement.value
    ? Array.from(layers.value).indexOf(layerElement.value)
    : -1
})

const isBodyPointerEventsDisabled = computed(() => {
  return context.layersWithOutsidePointerEventsDisabled.size > 0
})

const isPointerEventsEnabled = computed(() => {
  const localLayers = Array.from(layers.value)
  const [highestLayerWithOutsidePointerEventsDisabled] = [...context.layersWithOutsidePointerEventsDisabled].slice(-1)
  const highestLayerWithOutsidePointerEventsDisabledIndex = localLayers.indexOf(highestLayerWithOutsidePointerEventsDisabled)

  return index.value >= highestLayerWithOutsidePointerEventsDisabledIndex
})

const pointerDownOutside = usePointerDownOutside(async (event) => {
  const isPointerDownOnBranch = [...context.branches].some(branch =>
    branch?.contains(event.target as HTMLElement),
  )

  if (!isPointerEventsEnabled.value || isPointerDownOnBranch)
    return
  emits('pointerDownOutside', event)
  emits('interactOutside', event)
  await nextTick()
  if (!event.defaultPrevented)
    emits('dismiss')
}, layerElement)

const focusOutside = useFocusOutside((event) => {
  const isFocusInBranch = [...context.branches].some(branch =>
    branch?.contains(event.target as HTMLElement),
  )

  if (isFocusInBranch)
    return
  emits('focusOutside', event)
  emits('interactOutside', event)
  if (!event.defaultPrevented)
    emits('dismiss')
}, layerElement)

onKeyStroke('Escape', (event) => {
  const isHighestLayer = index.value === layers.value.size - 1
  if (!isHighestLayer)
    return
  emits('escapeKeyDown', event)
  if (!event.defaultPrevented)
    emits('dismiss')
})

watchEffect((cleanupFn) => {
  if (!layerElement.value)
    return

  // Capture the value for cleanup: `props.disableOutsidePointerEvents` is reactive,
  // so reading it inside `cleanupFn` would return the *new* value. When the prop
  // toggles `true` -> `false` while the layer stays mounted (e.g. `unmountOnHide: false`),
  // that would skip restoring the body pointer-events and leave the page frozen.
  const element = layerElement.value
  const disabledOutsidePointerEvents = props.disableOutsidePointerEvents
  const disabledLayers = context.layersWithOutsidePointerEventsDisabled
  // Read `size` from the raw set so this effect doesn't track the reactive set
  // it also mutates (which would recurse). Mutations still go through the proxy
  // so dependent computeds (e.g. `isBodyPointerEventsDisabled`) stay reactive.
  const rawDisabledLayers = toRaw(disabledLayers)

  if (disabledOutsidePointerEvents) {
    if (rawDisabledLayers.size === 0) {
      context.originalBodyPointerEvents = ownerDocument.value.body.style.pointerEvents
      ownerDocument.value.body.style.pointerEvents = 'none'
    }
    disabledLayers.add(element)
  }
  layers.value.add(element)

  cleanupFn(() => {
    if (!disabledOutsidePointerEvents)
      return

    disabledLayers.delete(element)

    if (
      rawDisabledLayers.size === 0
      && !isNullish(context.originalBodyPointerEvents)
    ) {
      ownerDocument.value.body.style.pointerEvents = context.originalBodyPointerEvents
    }
  })
})

watchEffect((cleanupFn) => {
  cleanupFn(() => {
    if (!layerElement.value)
      return
    layers.value.delete(layerElement.value)
    context.layersWithOutsidePointerEventsDisabled.delete(layerElement.value)
  })
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    data-dismissable-layer
    :style="{
      pointerEvents: isBodyPointerEventsDisabled
        ? isPointerEventsEnabled
          ? 'auto'
          : 'none'
        : undefined,
    }"
    @focus.capture="focusOutside.onFocusCapture"
    @blur.capture="focusOutside.onBlurCapture"
    @pointerdown.capture="pointerDownOutside.onPointerDownCapture"
  >
    <slot />
  </Primitive>
</template>
