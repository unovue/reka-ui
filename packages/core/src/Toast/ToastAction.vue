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
import { computed, mergeProps, useSlots } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectToastRootContext } from './ToastRootImpl.vue'

defineOptions({
  // `$attrs` are merged over the announce-exclude marks and under the part's
  // own bindings: the order the former `<ToastAnnounceExclude as-child>`
  // wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastActionProps>(), {
  as: 'button',
  closeOnClick: true,
})

const rootContext = injectToastRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
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
    rootContext.onClose(event, 'action-press')
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-if="isRendered && altText"
    :ref="forwardRef"
    v-bind="mergeProps({ 'data-reka-toast-announce-exclude': '', 'data-reka-toast-announce-alt': altText || undefined }, $attrs, { type: as === 'button' ? 'button' : undefined, onClick: handleClick })"
  >
    <slot>{{ actionProps?.label }}</slot>
  </component>
</template>
