<script setup lang="ts">
import { computed } from 'vue'
import { useForwardPropsEmits } from '@/shared'
import Child from './Child.vue'

// Common consumer pattern: derive a bind object from `forwarded` in a computed.
const props = defineProps<{ label?: string }>()
const emits = defineEmits<{ 'select': [v: number], 'highlight': [v: number], 'update:modelValue': [v: number] }>()
const forwarded = useForwardPropsEmits(props, emits)
const bind = computed(() => ({ ...forwarded.value, 'data-x': '1' }))
</script>

<template>
  <Child v-bind="bind" />
</template>
