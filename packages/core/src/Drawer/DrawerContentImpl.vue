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
import { mergeProps } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { useDrawerContent } from './useDrawer'
import { registerDrawerCssProperties } from './utils'

const props = withDefaults(defineProps<DrawerContentImplProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerContentImplEmits>()

const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

registerDrawerCssProperties()

// Snap points, swipe dismiss, dismiss reasons, `openComplete` wiring and the
// nested-drawer CSS vars live in the composable; FocusScope + DismissableLayer
// stay here. `$attrs` merges AFTER the surface (consumer attrs win, handlers chain).
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
</script>

<template>
  <FocusScope
    as-child
    loop
    :trapped="props.trapFocus"
    @mount-auto-focus="onMountAutoFocus"
    @unmount-auto-focus="emits('closeAutoFocus', $event)"
  >
    <DismissableLayer
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      v-bind="mergeProps(content.attrs.value, $attrs)"
      @dismiss="onDismiss"
      @escape-key-down="onEscapeKeyDown"
      @focus-outside="onFocusOutside"
      @interact-outside="onInteractOutside"
      @pointer-down-outside="onPointerDownOutside"
    >
      <slot />
    </DismissableLayer>
  </FocusScope>
</template>
