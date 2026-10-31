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

// The closed content's lean items, in their detached fragment: while they are
// mounted, the closed typeahead reads them.
onMounted(() => props.context.closedItems?.setHarvestMounted(true))
onBeforeUnmount(() => props.context.closedItems?.setHarvestMounted(false))
</script>

<template>
  <slot />
</template>
