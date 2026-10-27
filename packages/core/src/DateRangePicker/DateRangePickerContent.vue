<script lang="ts">
import type { PopoverContentEmits, PopoverContentProps, PopoverPortalProps } from '..'
import { computed } from 'vue'
import { handleCalendarInitialFocus } from '@/shared/date'
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from '..'

export interface DateRangePickerContentProps extends PopoverContentProps {
  /**
   * Props to control the portal wrapped around the content.
   */
  portal?: PopoverPortalProps
}
export type DateRangePickerContentEmits = PopoverContentEmits
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerContentProps>()
const emits = defineEmits<DateRangePickerContentEmits>()

const propsToForward = computed(() => ({
  ...props,
  portal: undefined,
}))
const forwarded = useForwardPropsEmits(propsToForward, emits)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopoverPortal v-bind="portal">
    <PopoverContent
      :ref="forwardRef"
      v-bind="{ ...forwarded, ...$attrs }"
      @open-auto-focus="event => {
        emits('openAutoFocus', event)

        if (!event.defaultPrevented && event.target) {
          handleCalendarInitialFocus(event.target as HTMLElement)
          event.preventDefault()
        }
      }"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
