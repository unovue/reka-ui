<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { ref, watchEffect } from 'vue'
import { Icon } from '@iconify/vue'

const el = ref<HTMLElement>()
const { height } = useElementSize(el)

watchEffect(() => {
  if (height.value) {
    document.documentElement.style.setProperty(
      '--vp-layout-top-height',
      `${height.value || 40}px`,
    )
  }
})
</script>

<template>
  <div
    ref="el"
    class="flex items-center justify-center w-full h-11 fixed inset-0 z-[10000] bg-gradient-to-r from-teal9 to-green9"
  >
    <h4 class="font-semibold text-sm">
      <a
        href="https://reka-ui.com/"
        target="_blank"
        class="inline-flex items-center gap-2 hover:underline group"
      >
        Check out v2! <Icon
          class="text-lg group-hover:translate-x-1 transition"
          icon="lucide:arrow-right"
        />
      </a>
    </h4>
  </div>
</template>
