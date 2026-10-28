<script setup lang="ts">
import { useForwardPropsEmits } from '@/shared'
import Child from './Child.vue'

const props = defineProps<{ label?: string }>()
const emits = defineEmits<{ 'select': [v: number], 'highlight': [v: number], 'update:modelValue': [v: number] }>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <Child v-bind="forwarded" /><slot />
</template>
