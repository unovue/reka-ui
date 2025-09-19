<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { useData } from 'vitepress'
import { ref, watchPostEffect } from 'vue'

const { isDark } = useData()

const switchTitle = ref('')

watchPostEffect(() => {
  switchTitle.value = isDark.value
    ? 'Switch to light theme'
    : 'Switch to dark theme'
})
</script>

<template>
  <SwitchRoot
    id="theme-toggle"
    v-model="isDark"
    class="w-11 h-6 flex bg-muted border border-muted-foreground/10 rounded-full relative flex-shrink-0"
    :aria-label="switchTitle"
  >
    <SwitchThumb
      class="w-5 h-5 my-auto bg-background text-xs flex items-center justify-center text-muted-foreground border border-muted rounded-full !transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-5"
    >
      <Icon
        v-if="isDark"
        icon="lucide:moon-star"
      />
      <Icon
        v-else
        icon="lucide:sun"
      />
    </SwitchThumb>
  </SwitchRoot>
</template>
