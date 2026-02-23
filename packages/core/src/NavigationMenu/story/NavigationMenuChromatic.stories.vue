<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import NavigationMenu from './_NavigationMenu.vue'

const { Story } = defineMeta({
  title: 'Navigation Menu/Chromatic',
})
</script>

<template>
  <Story
    name="Default"
    as-child
  >
    <NavigationMenu />
  </Story>

  <Story
    name="Disabled click trigger"
    as-child
  >
    <NavigationMenu disable-click-trigger />
  </Story>

  <Story
    name="Disabled hover trigger"
    as-child
  >
    <NavigationMenu disable-hover-trigger />
  </Story>
</template>
