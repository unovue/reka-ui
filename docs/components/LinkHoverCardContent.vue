<script setup lang="ts">
import { computed } from 'vue'

type PropDef = {
  name?: string
  required?: boolean
  default?: string | boolean
  type: string
  typeSimple: string
  description?: string
}

interface PropsTableProps {
  title: string
  data: string
}
const props = defineProps<PropsTableProps>()

const data = computed(() => JSON.parse(props.data))
</script>

<template>
  <ul class="list-none m-0 p-0 relative [&>li:not(:last-child)]:border-b [&>li:not(:last-child)]:mb-2">
    <h5
      class="font-mono font-bold capitalize text-xs px-3 py-2 w-full border-y border-muted-foreground/30 sticky top-0 bg-card"
    >
      {{ title }}
    </h5>
    <li
      v-for="(prop, index) in data"
      :key="`${prop.name}-${index}`"
      class="border-muted px-3"
    >
      <div class="inline-flex items-center gap-2 flex-wrap">
        <div class="text-primary font-mono font-bold text-xs">
          {{ prop.name }}
        </div>
        <code class="px-2 py-0.5 text-foreground bg-muted text-xs">
          {{ prop.typeSimple ? prop.typeSimple : prop.type }}
        </code>
        <code
          v-if="prop.default"
          class="px-2 py-0.5 text-foreground bg-muted text-xs"
        >
          default: {{ prop.default }}
        </code>
        <code
          v-if="prop.required"
          class="px-2 py-0.5 text-red-500 bg-muted text-xs"
        >
          {{ prop.required ? "required" : null }}
        </code>
      </div>

      <p
        class="text-muted-foreground text-sm my-0"
        v-html="prop.description"
      />
    </li>
  </ul>
</template>
