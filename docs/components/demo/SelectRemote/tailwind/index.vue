<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { ref, shallowRef } from 'vue'

interface User { id: number, name: string, role: string }

// Stand-in for `fetch('/api/reviewers')`.
function fetchReviewers(): Promise<User[]> {
  return new Promise(resolve => setTimeout(resolve, 400, [
    { id: 1, name: 'Ada Lovelace', role: 'Maintainer' },
    { id: 2, name: 'Alan Turing', role: 'Reviewer' },
    { id: 3, name: 'Grace Hopper', role: 'Maintainer' },
    { id: 4, name: 'Linus Torvalds', role: 'Reviewer' },
  ]))
}

// The saved value arrives with the page, long before the options do.
const reviewer = ref<User>({ id: 3, name: 'Grace Hopper', role: 'Maintainer' })
const reviewers = shallowRef<User[]>()
const loading = ref(false)

async function loadOnFirstOpen(open: boolean) {
  if (!open || reviewers.value || loading.value)
    return
  loading.value = true
  reviewers.value = await fetchReviewers()
  loading.value = false
}
</script>

<template>
  <!--
    `by="id"` matches the saved object against the fetched ones, and
    `display-value` labels the trigger without rendering any item.
  -->
  <SelectRoot
    v-model="reviewer"
    by="id"
    :display-value="(user: User) => user.name"
    @update:open="loadOnFirstOpen"
  >
    <SelectTrigger
      aria-label="Reviewer"
      class="inline-flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-lg border border-muted bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
    >
      <SelectValue placeholder="Assign a reviewer" />
      <Icon
        icon="radix-icons:chevron-down"
        class="h-4 w-4"
      />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="z-[100] w-[var(--reka-select-trigger-width)] rounded-lg border border-muted bg-card shadow-sm data-[side=bottom]:animate-slideUpAndFade"
      >
        <SelectViewport class="p-1">
          <div
            v-if="loading"
            class="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground"
          >
            <Icon
              icon="lucide:loader-circle"
              class="h-4 w-4 animate-spin"
            />
            Loading reviewers…
          </div>
          <SelectItem
            v-for="user in reviewers"
            :key="user.id"
            :value="user"
            class="relative flex select-none items-center justify-between gap-4 rounded-md py-1.5 pl-7 pr-2 text-sm text-foreground outline-none data-[highlighted]:bg-muted"
          >
            <SelectItemIndicator class="absolute left-2 inline-flex items-center">
              <Icon
                icon="radix-icons:check"
                class="h-4 w-4"
              />
            </SelectItemIndicator>
            <SelectItemText>{{ user.name }}</SelectItemText>
            <span class="text-xs text-muted-foreground">{{ user.role }}</span>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
