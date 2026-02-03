<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { PrimitiveProps } from '@/Primitive'

export interface MonthPickerPrevProps extends PrimitiveProps {
  /** The function to be used for the prev page. Overwrites the `prevPage` function set on the `MonthPickerRoot`. */
  prevPage?: (placeholder: DateValue) => DateValue
}

export interface MonthPickerPrevSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectMonthPickerRootContext } from './MonthPickerRoot.vue'

const props = withDefaults(defineProps<MonthPickerPrevProps>(), { as: 'button' })
defineSlots<MonthPickerPrevSlot>()

const rootContext = injectMonthPickerRootContext()

const disabled = computed(() => rootContext.disabled.value || rootContext.isPrevButtonDisabled(props.prevPage))
</script>

<template>
  <Primitive
    aria-label="Previous year"
    :as="props.as"
    :as-child="props.asChild"
    :type="as === 'button' ? 'button' : undefined"
    :aria-disabled="disabled || undefined"
    :data-disabled="disabled || undefined"
    :disabled="disabled"
    @click="rootContext.prevPage(props.prevPage)"
  >
    <slot :disabled>
      Prev year
    </slot>
  </Primitive>
</template>
