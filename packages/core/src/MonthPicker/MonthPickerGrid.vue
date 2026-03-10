<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface MonthPickerGridProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectMonthPickerRootContext } from './MonthPickerRoot.vue'

const props = withDefaults(defineProps<MonthPickerGridProps>(), { as: 'table' })

const rootContext = injectMonthPickerRootContext()
const disabled = computed(() => rootContext.disabled.value ? true : undefined)
const readonly = computed(() => rootContext.readonly.value ? true : undefined)
</script>

<template>
  <!-- role="application" ensures NVDA passes keyboard events to the web app for arrow key navigation -->
  <div role="application">
    <Primitive
      v-bind="props"
      tabindex="-1"
      role="grid"
      :aria-labelledby="rootContext.headingId"
      :aria-readonly="readonly"
      :aria-disabled="disabled"
      :data-readonly="readonly && ''"
      :data-disabled="disabled && ''"
    >
      <slot />
    </Primitive>
  </div>
</template>
