<script setup lang="ts">
import PopperAnchor from './PopperAnchor.vue'
import PopperContent from './PopperContent.vue'
import PopperRoot from './PopperRoot.vue'

defineProps<{ label: string, show?: boolean }>()
</script>

<template>
  <PopperRoot>
    <PopperAnchor style="position: fixed; top: 100px; left: 100px; width: 80px; height: 20px">
      Anchor
    </PopperAnchor>
    <PopperContent
      data-testid="content"
      :data-label="label"
    >
      <span>{{ label }}</span><b v-if="show">shown</b>
    </PopperContent>
  </PopperRoot>
</template>
