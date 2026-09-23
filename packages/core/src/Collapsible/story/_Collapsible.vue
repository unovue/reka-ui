<script setup lang="ts">
import type { CollapsibleRootEmits, CollapsibleRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '..'

const props = defineProps<CollapsibleRootProps>()
const emits = defineEmits<CollapsibleRootEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <CollapsibleRoot
    v-bind="forwarded"
  >
    <CollapsibleTrigger>Trigger</CollapsibleTrigger>
    <CollapsibleContent>Content</CollapsibleContent>
  </CollapsibleRoot>
</template>
