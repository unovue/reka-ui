<script lang="ts">
import type { ToastCloseProps } from './ToastClose.vue'

export interface ToastActionProps extends ToastCloseProps {
  /**
   * A short description for an alternate way to carry out the action. For screen reader users
   * who will not be able to navigate to the button easily/quickly.
   * @example <ToastAction altText="Goto account settings to upgrade">Upgrade</ToastAction>
   * @example <ToastAction altText="Undo (Alt+U)">Undo</ToastAction>
   */
  altText: string
  /**
   * Whether the action should close the toast when clicked.
   *
   * @defaultValue true
   */
  closeOnClick?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import ToastAnnounceExclude from './ToastAnnounceExclude.vue'
import ToastClose from './ToastClose.vue'

const props = withDefaults(defineProps<ToastActionProps>(), {
  as: 'button',
  closeOnClick: true,
})

if (!props.altText)
  throw new Error('Missing prop `altText` expected on `ToastAction`')

const { forwardRef } = useForwardExpose()
</script>

<template>
  <ToastAnnounceExclude
    v-if="altText"
    :alt-text="altText"
    as-child
  >
    <ToastClose
      v-if="closeOnClick"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </ToastClose>

    <Primitive
      v-else
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :type="as === 'button' ? 'button' : undefined"
    >
      <slot />
    </Primitive>
  </ToastAnnounceExclude>
</template>
