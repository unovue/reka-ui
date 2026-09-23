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
  /** Internal: whether a kept-mounted content is currently shown. */
  present?: boolean
}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { PopperContent } from '@/Popper'
import { useFocusGuards, useForwardExpose, useForwardProps } from '@/shared'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverContentImplPrivateProps>(), { present: true })
const emits = defineEmits<PopoverContentImplEmits>()

const forwarded = useForwardProps(reactiveOmit(props, 'trapFocus', 'disableOutsidePointerEvents', 'present'))
const { forwardRef } = useForwardExpose()

const rootContext = injectPopoverRootContext()
useFocusGuards()

// Kept-mounted content (`unmountOnHide: false`) never unmounts its FocusScope,
// so synthesize `closeAutoFocus` when it hides; consumers restore focus as usual.
watch(() => props.present, (present, wasPresent) => {
  if (present || !wasPresent)
    return
  emits('closeAutoFocus', new CustomEvent('focusScope.autoFocusOnUnmount', { cancelable: true }))
})

// Kept-mounted content (`unmountOnHide: false`) already restored focus when it
// was hidden, so removing it later (e.g. `v-if`) must not move focus again.
function handleUnmountAutoFocus(event: Event) {
  if (!props.present) {
    event.preventDefault()
    return
  }
  emits('closeAutoFocus', event)
}
</script>

<template>
  <FocusScope
    as-child
    loop
    :trapped="trapFocus"
    :present="present"
    @mount-auto-focus="emits('openAutoFocus', $event)"
    @unmount-auto-focus="handleUnmountAutoFocus"
  >
    <DismissableLayer
      as-child
      :present="present"
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @dismiss="rootContext.onOpenChange(false)"
    >
      <PopperContent
        v-bind="forwarded"
        :id="rootContext.contentId"
        :ref="forwardRef"
        :present="present"
        :data-state="rootContext.open.value ? 'open' : 'closed'"
        :aria-labelledby="rootContext.triggerId"
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
        role="dialog"
      >
        <slot />
      </PopperContent>
    </DismissableLayer>
  </FocusScope>
</template>
