<script setup lang="ts">
import DocOutline from '../.vitepress/components/DocOutline.vue'
</script>

<template>
  <div class="flex mt-12">
    <div class="flex-1 pr-8">
      <slot />
    </div>

    <div class="hidden xl:block w-64 flex-shrink-0 py-12 pl-2 sticky top-[7.25rem] h-full overflow-y-auto md:overflow-x-hidden max-h-[calc(100vh-7.25rem)]">
      <DocOutline />
    </div>
  </div>
</template>
