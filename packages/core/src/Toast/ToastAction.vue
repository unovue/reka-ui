<script lang="ts">
import type { ToastCloseProps } from './ToastClose.vue'

export interface ToastActionProps extends ToastCloseProps {
  /**
   * A short description for an alternate way to carry out the action. For screen reader users
   * who will not be able to navigate to the button easily/quickly.
   *
   * A rendered action requires `altText`, unless the toast passed to `ToastRoot` has `actionProps.altText`.
   * @example <ToastAction altText="Goto account settings to upgrade">Upgrade</ToastAction>
   * @example <ToastAction altText="Undo (Alt+U)">Undo</ToastAction>
   */
  altText?: string
  /**
   * Whether the action should close the toast when clicked.
   *
   * @defaultValue true
   */
  closeOnClick?: boolean
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import ToastAnnounceExclude from './ToastAnnounceExclude.vue'
import { injectToastRootContext } from './ToastRootImpl.vue'

const props = withDefaults(defineProps<ToastActionProps>(), {
  as: 'button',
  closeOnClick: true,
})

const rootContext = injectToastRootContext()
const { forwardRef } = useForwardExpose()
const slots = useSlots()

const actionProps = computed(() => rootContext.toast.value?.actionProps)
// A managed toast without `actionProps` renders no action, unless slot content is given.
const isRendered = computed(() => !!slots.default || !rootContext.toast.value || !!actionProps.value)
const altText = computed(() => props.altText ?? actionProps.value?.altText)

if (isRendered.value && !altText.value)
  throw new Error('Missing prop `altText` expected on `ToastAction`')

function handleClick(event: MouseEvent) {
  actionProps.value?.onClick?.(event)
  if (actionProps.value?.closeOnClick ?? props.closeOnClick)
    // Pass the event on, like `ToastClose`: a keyboard click hands focus to the viewport.
    rootContext.onClose(event as PointerEvent)
}
</script>

<template>
  <ToastAnnounceExclude
    v-if="isRendered && altText"
    :alt-text="altText"
    as-child
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :type="as === 'button' ? 'button' : undefined"
      @click="handleClick"
    >
      <slot>{{ actionProps?.label }}</slot>
    </Primitive>
  </ToastAnnounceExclude>
</template>
