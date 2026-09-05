<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineProps<{
  content: string
}>()
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger
      class="bg-transparent hover:bg-background focus:bg-background text-muted-foreground focus:text-foreground hover:text-foreground inline-flex h-[35px] w-[35px] items-center justify-center rounded-lg"
      as-child
    >
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        class="border border-muted data-[state=open]:data-[delayed]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[delayed]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[delayed]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[delayed]:data-[side=bottom]:animate-slideUpAndFade text-foreground select-none rounded-md bg-background px-[15px] py-[10px] text-xs leading-none will-change-[transform,opacity]"
        :side-offset="6"
      >
        <span
          class="contents"
          v-html="content"
        />
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
