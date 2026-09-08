<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { TemporalDate } from '@/temporal/types'

export interface YearRangePickerNextProps extends PrimitiveProps {
  /** The function to be used for the next page. Overwrites the `nextPage` function set on the Root. */
  nextPage?: (placeholder: TemporalDate) => TemporalDate
}

export interface YearRangePickerNextSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectYearRangePickerRootContext } from './YearRangePickerRoot.vue'

const props = withDefaults(defineProps<YearRangePickerNextProps>(), { as: 'button' })
defineSlots<YearRangePickerNextSlot>()

const rootContext = injectYearRangePickerRootContext()

const disabled = computed(() => rootContext.disabled.value || rootContext.isNextButtonDisabled(props.nextPage))

function handleClick() {
  if (disabled.value)
    return
  rootContext.nextPage(props.nextPage)
}
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    aria-label="Next page"
    :type="props.as === 'button' ? 'button' : undefined"
    :aria-disabled="disabled || undefined"
    :data-disabled="disabled || undefined"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot :disabled>
      Next page
    </slot>
  </Primitive>
</template>
