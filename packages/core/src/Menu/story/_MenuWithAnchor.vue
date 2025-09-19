<script setup lang="ts">
import type { MenuProps } from '..'
import { useVModel } from '@vueuse/core'
import {
  MenuAnchor,
  MenuContent,
  MenuPortal,

  MenuRoot,
} from '..'

interface Props extends MenuProps {}
const props = withDefaults(defineProps<Props>(), {
  open: true,
})

const open = useVModel(props, 'open')
</script>

<template>
  <MenuRoot
    :open="open"
    :modal="false"
  >
    <MenuAnchor :style="{ display: 'inline-block' }" />
    <MenuPortal>
      <MenuContent
        class="inline-block box-border min-w-[130px] bg-white border border-gray-100 rounded-[6px] p-[5px] shadow-md font-sans text-[13px] focus-within:border-black"
        align="start"
        @close-auto-focus.prevent
      >
        <slot />
      </MenuContent>
    </MenuPortal>
  </MenuRoot>
</template>
