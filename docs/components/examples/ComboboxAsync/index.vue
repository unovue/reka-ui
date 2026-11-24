<script setup lang="ts">
import type { User } from './api'
import { Icon } from '@iconify/vue'
import { watchDebounced } from '@vueuse/core'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from 'reka-ui'
import { ref, shallowRef } from 'vue'
import { searchUsers } from './api'

const selected = shallowRef<User | undefined>()
const searchTerm = ref('')
const results = shallowRef<User[]>([])
const isPending = ref(false)

let controller: AbortController | undefined

async function runSearch(query: string) {
  // Abort the request still in flight. Without this a slow response for an
  // earlier keystroke can land after a fast one and overwrite fresher results.
  controller?.abort()
  controller = new AbortController()
  isPending.value = true

  try {
    results.value = await searchUsers(query, controller.signal)
    isPending.value = false
  }
  catch (error) {
    // A superseded request is not a failure — the newer one owns the state now.
    if ((error as Error).name !== 'AbortError')
      throw error
  }
}

// `immediate` fills the list with default suggestions before the first keystroke.
watchDebounced(searchTerm, runSearch, { debounce: 300, immediate: true })
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
      <Icon
        icon="lucide:search"
        class="size-4 shrink-0 text-muted-foreground"
      />
      <ComboboxInput
        v-model="searchTerm"
        class="w-full bg-transparent outline-none placeholder-muted-foreground"
        placeholder="Search teammates…"
        :display-value="(user: User | undefined) => user?.name ?? ''"
      />
      <ComboboxTrigger class="shrink-0">
        <Icon
          v-if="isPending"
          icon="lucide:loader-circle"
          class="size-4 animate-spin text-muted-foreground"
        />
        <Icon
          v-else
          icon="lucide:chevron-down"
          class="size-4 text-muted-foreground"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent class="absolute z-10 w-full mt-1 rounded-lg border border-muted bg-card shadow-lg overflow-hidden data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade">
      <ComboboxViewport class="max-h-[240px] p-1">
        <!-- `ignore-filter` hands filtering to the server, so the empty state has
             to distinguish "still loading" from "the server found nothing". -->
        <div
          v-if="isPending && !results.length"
          class="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground"
        >
          <Icon
            icon="lucide:loader-circle"
            class="size-4 animate-spin"
          />
          Searching…
        </div>
        <ComboboxEmpty
          v-else
          class="p-4 text-center text-sm text-muted-foreground"
        >
          No teammate matches “{{ searchTerm }}”
        </ComboboxEmpty>

        <ComboboxItem
          v-for="user in results"
          :key="user.id"
          :value="user"
          class="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-foreground select-none cursor-default outline-none data-[highlighted]:bg-muted"
        >
          <span class="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
            {{ user.name[0] }}
          </span>
          <span class="min-w-0">
            <span class="block truncate">{{ user.name }}</span>
            <span class="block truncate text-xs text-muted-foreground">{{ user.team }}</span>
          </span>
          <ComboboxItemIndicator class="ml-auto shrink-0">
            <Icon
              icon="lucide:check"
              class="size-4"
            />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
