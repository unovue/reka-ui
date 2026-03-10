<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarGridProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

const props = withDefaults(defineProps<RangeCalendarGridProps>(), { as: 'table' })

const rootContext = injectRangeCalendarRootContext()

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
      :aria-readonly="readonly"
      :aria-disabled="disabled"
      :data-readonly="readonly && ''"
      :data-disabled="disabled && ''"
      @mouseleave="rootContext.focusedValue.value = undefined"
    >
      <slot />
    </Primitive>
  </div>
</template>
