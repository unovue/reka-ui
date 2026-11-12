<script setup lang="ts">
defineProps<{
  /** Drawers get roomier controls because they are driven by touch. */
  touch?: boolean
}>()

// The values live in the parent alongside `open`, so crossing the breakpoint —
// which unmounts one root and mounts the other — does not discard what was typed.
const name = defineModel<string>('name', { required: true })
const username = defineModel<string>('username', { required: true })
</script>

<template>
  <form
    class="flex flex-col gap-3"
    @submit.prevent
  >
    <label class="flex flex-col gap-1.5 text-sm">
      <span class="font-medium text-foreground">Name</span>
      <input
        v-model="name"
        name="name"
        autocomplete="name"
        class="rounded-lg border border-muted bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        :class="touch ? 'h-11' : 'h-9'"
      >
    </label>
    <label class="flex flex-col gap-1.5 text-sm">
      <span class="font-medium text-foreground">Username</span>
      <input
        v-model="username"
        name="username"
        autocomplete="username"
        class="rounded-lg border border-muted bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        :class="touch ? 'h-11' : 'h-9'"
      >
    </label>
  </form>
</template>
