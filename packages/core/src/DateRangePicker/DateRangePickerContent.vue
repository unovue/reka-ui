<script lang="ts">
import type { PopoverContentEmits, PopoverContentProps, PopoverPortalProps } from '@/Popover'
import { computed } from 'vue'
import { PopoverContent, PopoverPortal } from '@/Popover'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import { handleCalendarInitialFocus } from '@/shared/date'

export interface DateRangePickerContentProps extends PopoverContentProps {
  /**
   * Props to control the portal wrapped around the content.
   */
  portal?: PopoverPortalProps
}
export type DateRangePickerContentEmits = PopoverContentEmits
</script>

<script setup lang="ts">
import { injectFieldForControl, provideFieldControlOwner } from '@/Field/useFieldBinding'

const props = defineProps<DateRangePickerContentProps>()
const emits = defineEmits<DateRangePickerContentEmits>()

const propsToForward = computed(() => ({
  ...props,
  portal: undefined,
}))
const forwarded = useForwardPropsEmits(propsToForward, emits)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The picker's field is the composed date field's: a control in the calendar leaves it alone.
provideFieldControlOwner(injectFieldForControl())
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
