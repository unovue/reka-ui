<script setup>
// ListboxLongAsChild: ListboxLong through `ListboxContent as-child`. The content's
// tabindex stays in the render on this path, so its update costs more than
// ListboxLong's; this row keeps that cost from growing.
import { ListboxContent, ListboxItem, ListboxItemIndicator, ListboxRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 2 } })
const opts = Array.from({ length: 1000 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }))
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ListboxRoot highlight-on-hover>
      <ListboxContent as-child>
        <section>
          <ListboxItem
            v-for="o in opts"
            :key="o.value"
            :value="o.value"
          >
            <span>{{ o.label }}</span><ListboxItemIndicator>✓</ListboxItemIndicator>
          </ListboxItem>
        </section>
      </ListboxContent>
    </ListboxRoot>
  </div>
</template>
