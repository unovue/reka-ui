<script setup lang="ts">
import { computed, watch } from 'vue'
import { type SidebarItem, useSidebarControl } from '../composables/sidebar'
import { useCurrentElement } from '@vueuse/core'
import { withBase } from 'ufo'

const props = defineProps<{
  base?: string
  item: SidebarItem
}>()
const { isActiveLink } = useSidebarControl(computed(() => props.item))

const elRef = useCurrentElement()

watch(isActiveLink, () => {
  if (isActiveLink.value && elRef.value instanceof HTMLElement) {
    elRef.value.scrollIntoView({
      block: 'center',
    })
  }
}, { immediate: true })
</script>

<template>
  <div
    class="flex items-center text-sm text-muted-foreground hover:bg-card rounded-lg"
    :class="{ 'is-active !bg-primary/10 !text-primary font-semibold': isActiveLink }"
  >
    <a
      :href="base && item.link ? withBase(item.link, base) : item.link"
      class="py-1 min-h-8 px-4 flex items-center w-full"
      v-html="item.text"
    />
  </div>
</template>
