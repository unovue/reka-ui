<script setup lang="ts">
import { hyphenate } from '@vueuse/core'
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<{
  name: string
}>()

const UTILITY_COMPONENT = ['ConfigProvider', 'VisuallyHidden', 'FocusScope', 'RovingFocus']

const href = computed(() => {
  const utilityComponent = UTILITY_COMPONENT.find(c => props.name.includes(c))
  if (utilityComponent) {
    const hash = hyphenate(props.name.split(utilityComponent)?.[1])
    return `/docs/utilities/${hyphenate(utilityComponent)}${hash ? `#${hash}` : ''}`
  }
  else {
    const [last, ...parts] = hyphenate(props.name).split('-').reverse()
    return `/docs/components/${parts.reverse().join('-')}#${last}`
  }
})
</script>

<template>
  <HoverCardRoot :open-delay="300">
    <HoverCardTrigger
      as="a"
      :href="href"
      class="not-prose !text-inherit underline-offset-[3px] decoration-1 underline decoration-dotted"
    >
      <slot />
    </HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        class="w-[500px] h-[16.5rem] rounded-lg border border-muted-foreground/30 bg-card shadow-xl overflow-x-hidden prose dark:prose-invert [&>div]:my-2 [&>ul:first-child>h5]:border-t-0"
        side="top"
        align="start"
        :align-offset="-20"
      >
        <slot name="content" />

        <HoverCardArrow
          class="fill-card stroke-muted-foreground/30 -translate-y-[1px]"
          :width="16"
          :height="8"
        />
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
