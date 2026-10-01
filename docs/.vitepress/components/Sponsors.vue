<script setup lang="ts">
import { sponsor } from '../meta'
</script>

<template>
  <a
    :href="sponsor"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Sponsor Reka UI on GitHub"
    class="block"
  >
    <img
      src="/sponsors.svg"
      alt="Reka UI sponsors"
      class="w-full h-auto"
      loading="lazy"
    >
  </a>
</template>
