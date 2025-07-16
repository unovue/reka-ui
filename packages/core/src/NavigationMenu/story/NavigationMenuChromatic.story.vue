<script setup lang="ts">
import NavigationMenu from './_NavigationMenu.vue'
</script>

<template>
  <Story
    title="Navigation Menu/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Default">
      <NavigationMenu />
    </Variant>

    <Variant title="Disabled click trigger">
      <NavigationMenu disable-click-trigger />
    </Variant>

    <Variant title="Disabled hover trigger">
      <NavigationMenu disable-hover-trigger />
    </Variant>
  </Story>
</template>
