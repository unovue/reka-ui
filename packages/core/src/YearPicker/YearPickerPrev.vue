<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { TemporalDate } from '@/temporal/types'

export interface YearPickerPrevProps extends PrimitiveProps {
  /** The function to be used for the prev page. Overwrites the `prevPage` function set on the `YearPickerRoot`. */
  prevPage?: (placeholder: TemporalDate) => TemporalDate
}

export interface YearPickerPrevSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectYearPickerRootContext } from './YearPickerRoot.vue'

const props = withDefaults(defineProps<YearPickerPrevProps>(), { as: 'button' })
defineSlots<YearPickerPrevSlot>()

const rootContext = injectYearPickerRootContext()

const disabled = computed(() => rootContext.disabled.value || rootContext.isPrevButtonDisabled(props.prevPage))

function handleClick() {
  if (disabled.value)
    return
  rootContext.prevPage(props.prevPage)
}
</script>

<template>
  <Primitive
    aria-label="Previous page"
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' ? 'button' : undefined"
    :aria-disabled="disabled || undefined"
    :data-disabled="disabled || undefined"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot :disabled>
      Prev page
    </slot>
  </Primitive>
</template>
