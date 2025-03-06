<script setup lang="ts">
import { computed } from 'vue'
import { useEditLink } from '../composables/edit-link'
import { Icon } from '@iconify/vue'
import { discord, github, sponsor } from '../meta'

const editLink = useEditLink()

const links = computed(() => [
  { label: editLink.value.text, url: editLink.value.url, icon: 'lucide:pencil-line' },
  { label: 'Star on GitHub', url: github, icon: 'lucide:star' },
  { label: 'Chat on Discord', url: discord, icon: 'lucide:messages-square' },
  { label: 'Support the project', url: sponsor, icon: 'lucide:hand-heart' },
])
</script>

<template>
  <div>
    <div class="pt-4">
      <div class="font-bold text-sm mb-2">
        Community
      </div>

      <div class="space-y-3 lg:space-y-2 mt-4">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.url"
          target="_blank"
          class="inline-flex gap-2 items-center font-medium text-muted-foreground hover:text-foreground text-sm"
        >
          <Icon
            class="text-xl"
            :icon="link.icon"
          />
          <span>{{ link.label }}</span>
          <Icon
            class="text-base"
            icon="lucide:arrow-up-right"
          />
        </a>
      </div>
    </div>
  </div>
</template>
