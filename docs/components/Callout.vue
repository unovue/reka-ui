<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type: 'info' | 'tip' | 'warning' | 'danger'
  title?: string
}>(), { type: 'info' })

const activeType = computed(() => {
  switch (props.type) {
    case 'info': {
      return { icon: 'lucide:badge-info', class: 'text-blue-600 dark:text-blue-300 bg-blue-300/5 border-blue-300/20' }
    }
    case 'tip': {
      return { icon: 'lucide:badge-help', class: 'text-emerald-600 dark:text-emerald-300 bg-emerald-300/5 border-emerald-300/20' }
    }
    case 'danger': {
      return { icon: 'lucide:badge-x', class: 'text-red-600 dark:text-red-300 bg-red-300/5 border-red-300/20' }
    }
    case 'warning': {
      return { icon: 'lucide:badge-alert', class: 'text-yellow-600 dark:text-yellow-400 bg-yellow-400/5 border-yellow-400/20' }
    }
    default:
      return { icon: '', class: 'text-zinc-600 dark:text-zinc-300 bg-zinc-300/5 border-zinc-300/20' }
  }
})
</script>

<template>
  <div
    class="text-sm rounded-xl border px-6 py-4 last:[&>*]:mb-0 my-4"
    :class="activeType.class"
  >
    <div class="flex items-center gap-2 font-semibold mb-4">
      <Icon
        class="text-lg"
        :icon="activeType.icon"
      />
      <span v-if="title">{{ title }}</span>
      <span
        v-else
        class="capitalize"
      >
        {{ type }}
      </span>
    </div>

    <slot />
  </div>
</template>
