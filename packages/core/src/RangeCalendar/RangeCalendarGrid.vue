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
  <!--
    role="application" is intentional: it ensures screen readers like NVDA pass
    keyboard events (arrow keys) to the web app instead of intercepting them
    for virtual cursor navigation. This is the same pattern used by React Aria.
  -->
  <Primitive
    v-bind="props"
    tabindex="-1"
    role="application"
    :aria-readonly="readonly"
    :aria-disabled="disabled"
    :data-readonly="readonly && ''"
    :data-disabled="disabled && ''"
    @mouseleave="rootContext.focusedValue.value = undefined"
  >
    <slot />
  </Primitive>
</template>
