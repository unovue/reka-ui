<script setup lang="ts">
defineProps<{
  href: string
}>()
</script>

<template>
  <a
    :href="href"
    class="text-sm px-3 py-1 rounded-lg text-primary border-primary/20 bg-primary/10 font-semibold group transition inline-flex items-center relative"
  >
    <slot />
  </a>
</template>
