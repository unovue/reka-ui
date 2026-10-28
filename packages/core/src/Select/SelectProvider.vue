<script setup lang="ts">
import type { SelectRootContext } from './SelectRoot.vue'
import type { AcceptableValue } from '@/shared/types'
import { onBeforeUnmount, onMounted } from 'vue'
import { provideSelectContentContext, SelectContentHarvestContextValue } from './SelectContentImpl.vue'
import { provideSelectRootContext } from './SelectRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  context: SelectRootContext<AcceptableValue>
}>()

provideSelectRootContext(props.context)
provideSelectContentContext(SelectContentHarvestContextValue)

// The closed content's items, in their detached fragment: mounted, their
// labels are registered; before they unmount, the closed typeahead keeps them.
onMounted(() => props.context.closedItems?.itemsMounted())
onBeforeUnmount(() => props.context.closedItems?.capture())
</script>

<template>
  <slot />
</template>
