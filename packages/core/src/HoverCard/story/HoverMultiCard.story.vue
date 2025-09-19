<script setup lang="ts">
import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from '..'
</script>

<template>
  <Story
    title="Hover Card/Multi"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div class="flex h-10 items-center gap-0.5 mt-20">
        <HoverCardRoot
          v-for="(entry, index) in 20"
          :key="index"
          :open-delay="10"
          :close-delay="0"
        >
          <HoverCardTrigger as-child>
            <div
              class="h-full w-3 rounded-[1px] first:rounded-l-[4px] last:rounded-r-[4px] bg-green-500"
            />
          </HoverCardTrigger>
          <HoverCardPortal>
            <HoverCardContent
              side="top"
              :side-offset="5"
              class="font-brand bg-black w-16 text-center rounded-md px-2 py-1 text-white"
            >
              {{ index }}
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCardRoot>
      </div>
    </Variant>
  </Story>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
