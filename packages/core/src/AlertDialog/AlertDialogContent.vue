<script lang="ts">
import type {
  DialogContentEmits,
  DialogContentProps,
} from '@/Dialog'
import { createContext, useEmitAsProps, useForwardExpose } from '@/shared'

interface AlertDialogContentContext {
  onCancelElementChange: (el: HTMLElement | undefined) => void
}

export const [injectAlertDialogContentContext, provideAlertDialogContentContext]
  = createContext<AlertDialogContentContext>('AlertDialogContent')

export type AlertDialogContentEmits = DialogContentEmits
export interface AlertDialogContentProps extends DialogContentProps {}
</script>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { DialogContent } from '@/Dialog'

const props = withDefaults(defineProps<AlertDialogContentProps>(), {
  // Keep `undefined` (instead of Vue's boolean coercion to `false`) so
  // DialogContent can preserve the modal default while still honoring an
  // explicit `:disable-outside-pointer-events="false"`.
  disableOutsidePointerEvents: undefined,
})
const emits = defineEmits<AlertDialogContentEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()

const cancelElement = ref<HTMLElement | undefined>()

provideAlertDialogContentContext({
  onCancelElementChange: (el) => {
    // A cancel button that unmounts only releases the registered one once it has left the
    // document, so another cancel button that is still rendered keeps its registration.
    if (!el && cancelElement.value?.isConnected)
      return
    cancelElement.value = el
  },
})
</script>

<template>
  <DialogContent
    v-bind="{ ...props, ...emitsAsProps }"
    role="alertdialog"
    @pointer-down-outside.prevent
    @interact-outside.prevent
    @open-auto-focus="
      () => {
        nextTick(() => {
          cancelElement?.focus({
            preventScroll: true,
          });
        });
      }
    "
  >
    <slot />
  </DialogContent>
</template>
