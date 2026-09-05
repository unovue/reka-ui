<script lang="ts">
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
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

export interface PopoverContentImplProps extends PopperContentProps, DismissableLayerProps {}

interface PopoverContentImplPrivateProps extends PopoverContentImplProps {
  /**
   * Whether focus should be trapped within the `MenuContent`
   * @defaultValue false
   */
  trapFocus?: FocusScopeProps['trapped']
}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { PopperContent } from '@/Popper'
import { useFocusGuards, useForwardExpose, useForwardProps } from '@/shared'
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { getPopoverContentSurface } from './usePopover'

const props = defineProps<PopoverContentImplPrivateProps>()
const emits = defineEmits<PopoverContentImplEmits>()

const forwarded = useForwardProps(reactiveOmit(props, 'trapFocus', 'disableOutsidePointerEvents'))
const { forwardRef, currentElement } = useForwardExpose()

const rootContext = injectPopoverRootContext()
useFocusGuards(currentElement)

// id/role/aria-labelledby/data-state come from the shared surface builder
// (single source with `usePopover()`); FocusScope, DismissableLayer (which
// hands the dismiss reason + event to `onOpenChange`), PopperContent and the
// `--reka-popover-*` CSS variables stay in the SFC.
const content = getPopoverContentSurface(rootContext)
</script>

<template>
  <FocusScope
    as-child
    loop
    :trapped="trapFocus"
    @mount-auto-focus="emits('openAutoFocus', $event)"
    @unmount-auto-focus="emits('closeAutoFocus', $event)"
  >
    <DismissableLayer
      as-child
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @dismiss="(details) => rootContext.onOpenChange(false, details.reason, details.event)"
    >
      <PopperContent
        :ref="forwardRef"
        v-bind="mergeProps(forwarded, content.attrs.value)"
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
    </DismissableLayer>
  </FocusScope>
</template>
