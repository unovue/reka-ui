<script setup lang="ts">
import PopperAnchor from './PopperAnchor.vue'
import PopperArrow from './PopperArrow.vue'
import PopperContent from './PopperContent.vue'
import PopperRoot from './PopperRoot.vue'
</script>

<template>
  <PopperRoot>
    <PopperAnchor>
      Anchor
    </PopperAnchor>

    <PopperContent>
      Content

      <PopperArrow />
    </PopperContent>
  </PopperRoot>
</template>
