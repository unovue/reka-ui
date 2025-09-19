<script setup lang="ts">
import type { ScrollAreaRootProps } from '../ScrollAreaRoot.vue'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '..'

interface Props extends ScrollAreaRootProps {
  animated?: boolean
  vertical?: boolean
  horizontal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animated: false,
  vertical: true,
  horizontal: true,
})
</script>

<template>
  <ScrollAreaRoot
    class="w-[200px] h-[200px] shadow-lg overflow-hidden rounded bg-white text-gray-900"
    style="--scrollbar-size: 10px"
    v-bind="props"
  >
    <ScrollAreaViewport class="w-full h-full border-[inherit]">
      <div class="p-5">
        <slot />
      </div>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      v-if="vertical"
      class="flex select-none touch-none p-0.5 bg-black/10 transition hover:bg-black/20 data-[orientation=vertical]:w-[var(--scrollbar-size)]"
      :class="[animated
        && 'data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut']"
      orientation="vertical"
    >
      <ScrollAreaThumb
        :class="
          animated
            && 'data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut'
        "
        class="flex-1 bg-gray-400 rounded-[var(--scrollbar-size)] relative"
      />
    </ScrollAreaScrollbar>

    <ScrollAreaScrollbar
      v-if="horizontal"
      class="flex select-none touch-none p-0.5 bg-black/10 transition hover:bg-black/20 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-[var(--scrollbar-size)]"
      :class="[animated
        && 'data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut']"
      orientation="horizontal"
    >
      <ScrollAreaThumb
        :class="
          animated
            && 'data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut'
        "
        class="flex-1 bg-gray-400 rounded-[var(--scrollbar-size)] relative"
      />
    </ScrollAreaScrollbar>

    <ScrollAreaCorner class="bg-gray-300" />
  </ScrollAreaRoot>
</template>
