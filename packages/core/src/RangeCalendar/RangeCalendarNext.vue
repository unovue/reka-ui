<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarNextProps extends PrimitiveProps {
  /** The function to be used for the next page. Overwrites the `nextPage` function set on the `RangeCalendarRoot`. */
  nextPage?: (placeholder: DateValue) => DateValue
}

export interface RangeCalendarNextSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { disabledAttr, useTranslations } from '@/shared'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

const props = withDefaults(defineProps<RangeCalendarNextProps>(), { as: 'button' })

defineSlots<RangeCalendarNextSlot>()

const t = useTranslations()

const disabled = computed(() => rootContext.disabled.value || rootContext.isNextButtonDisabled(props.nextPage))

const rootContext = injectRangeCalendarRootContext()

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
    :aria-label="t('calendarNext')"
    :type="props.as === 'button' ? 'button' : undefined"
    :aria-disabled="disabled || undefined"
    :data-disabled="disabled || undefined"
    :disabled="disabledAttr(disabled, props.as, props.asChild)"
    @click="handleClick"
  >
    <slot :disabled>
      Next page
    </slot>
  </Primitive>
</template>
