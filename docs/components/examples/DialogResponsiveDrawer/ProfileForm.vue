<script setup lang="ts">
defineProps<{
  /** Drawers get roomier controls because they are driven by touch. */
  touch?: boolean
}>()

const fields = [
  { id: 'name', label: 'Name', value: 'Pedro Duarte' },
  { id: 'username', label: 'Username', value: '@peduarte' },
]
</script>

<template>
  <form
    class="flex flex-col gap-3"
    @submit.prevent
  >
    <label
      v-for="field in fields"
      :key="field.id"
      class="flex flex-col gap-1.5 text-sm"
    >
      <span class="font-medium text-foreground">{{ field.label }}</span>
      <input
        :name="field.id"
        :value="field.value"
        class="rounded-lg border border-muted bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        :class="touch ? 'h-11' : 'h-9'"
      >
    </label>
  </form>
</template>
