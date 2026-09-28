<script setup lang="ts">
import type { Host } from './hosts'
import { Icon } from '@iconify/vue'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxTrigger, ComboboxViewport, ComboboxVirtualizer } from 'reka-ui'
import { computed, ref, shallowRef } from 'vue'
import { hosts } from './hosts'

const selected = shallowRef<Host | undefined>()
const searchTerm = ref('')

// `ignore-filter` turns off the built-in filter: the virtualizer renders from
// `options`, so the list it is given has to be the already-filtered one.
const filtered = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query)
    return hosts
  return hosts.filter(host => host.name.includes(query))
})
</script>

<template>
  <ComboboxRoot
    v-model="selected"
    class="relative w-[280px]"
    open-on-focus
    open-on-click
    ignore-filter
  >
    <ComboboxAnchor class="w-full inline-flex items-center justify-between gap-2 rounded-lg border border-muted bg-card px-3 h-10 text-sm text-foreground focus-within:ring-2 focus-within:ring-primary/40">
      <ComboboxInput
        v-model="searchTerm"
        class="w-full bg-transparent outline-none placeholder-muted-foreground font-mono text-xs"
        placeholder="Search 10,000 hosts…"
        :display-value="(host: Host | undefined) => host?.name ?? ''"
      />
      <ComboboxTrigger class="shrink-0">
        <Icon
          icon="lucide:chevron-down"
          class="size-4 text-muted-foreground"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent class="absolute z-10 w-full mt-1 rounded-lg border border-muted bg-card shadow-lg overflow-hidden data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade">
      <!-- The viewport is the scroll container the virtualizer measures against,
           so it is the element that needs a bounded height. -->
      <ComboboxViewport class="max-h-[280px] p-1">
        <ComboboxEmpty class="p-4 text-center text-sm text-muted-foreground">
          No host matches “{{ searchTerm }}”
        </ComboboxEmpty>

        <ComboboxVirtualizer
          v-slot="{ option }"
          :options="filtered"
          :estimate-size="32"
          :overscan="8"
          :text-content="(host: Host) => host.name"
        >
          <ComboboxItem
            :value="option"
            class="flex w-full items-center gap-2 rounded-md px-2 h-8 text-xs text-foreground select-none cursor-default outline-none data-[highlighted]:bg-muted"
          >
            <span class="font-mono truncate">{{ option.name }}</span>
            <span class="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {{ option.role }}
            </span>
            <ComboboxItemIndicator class="shrink-0">
              <Icon
                icon="lucide:check"
                class="size-3.5"
              />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxVirtualizer>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
