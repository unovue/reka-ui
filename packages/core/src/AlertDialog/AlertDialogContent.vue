<script lang="ts">
import type { AlertDialogContentContext } from './useAlertDialog'
import type {
  DialogContentEmits,
  DialogContentProps,
} from '@/Dialog'
import { createContext, useEmitAsProps, useForwardElement } from '@/shared'

export const [injectAlertDialogContentContext, provideAlertDialogContentContext]
  = createContext<AlertDialogContentContext>('AlertDialogContent')

export type AlertDialogContentEmits = DialogContentEmits
export interface AlertDialogContentProps extends DialogContentProps {}
</script>

<script setup lang="ts">
import { DialogContent } from '@/Dialog'
import { useAlertDialogContent } from './useAlertDialog'

const props = withDefaults(defineProps<AlertDialogContentProps>(), {
  // Keep `undefined` (instead of Vue's boolean coercion to `false`) so
  // DialogContent can preserve the modal default while still honoring an
  // explicit `:disable-outside-pointer-events="false"`.
  disableOutsidePointerEvents: undefined,
})
const emits = defineEmits<AlertDialogContentEmits>()

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The outside-press guard and focus-Cancel-on-open live in the composable;
// `DialogContent` (Presence, FocusScope, DismissableLayer) stays the wrapper.
const { contentContext, onOpenAutoFocus, onPointerDownOutside, onInteractOutside } = useAlertDialogContent()
provideAlertDialogContentContext(contentContext)
</script>

<template>
  <DialogContent
    :ref="forwardRef"
    v-bind="{ ...props, ...emitsAsProps }"
    role="alertdialog"
    @pointer-down-outside="onPointerDownOutside"
    @interact-outside="onInteractOutside"
    @open-auto-focus="onOpenAutoFocus"
  >
    <slot />
  </DialogContent>
</template>
