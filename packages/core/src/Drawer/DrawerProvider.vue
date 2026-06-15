<script lang="ts">
import { createContext } from '@/shared'

export interface DrawerVisualState {
  swipeProgress: number
  frontmostHeight: number
}

export interface DrawerVisualStateStore {
  getSnapshot: () => DrawerVisualState
  set: (next: Partial<DrawerVisualState>) => void
  subscribe: (listener: () => void) => () => void
}

export interface DrawerProviderContext {
  active: import('vue').Ref<boolean>
  setDrawerOpen: (id: string, open: boolean) => void
  removeDrawer: (id: string) => void
  visualStateStore: DrawerVisualStateStore
}

export const [injectDrawerProviderContext, provideDrawerProviderContext]
  = createContext<DrawerProviderContext>('DrawerProvider')
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

function createVisualStateStore(): DrawerVisualStateStore {
  let state: DrawerVisualState = { swipeProgress: 0, frontmostHeight: 0 }
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => state,
    set(next) {
      const nextProgress = next.swipeProgress !== undefined
        ? (Number.isFinite(next.swipeProgress) ? next.swipeProgress : 0)
        : state.swipeProgress
      const nextHeight = next.frontmostHeight !== undefined
        ? (Number.isFinite(next.frontmostHeight) ? next.frontmostHeight : 0)
        : state.frontmostHeight
      if (nextProgress === state.swipeProgress && nextHeight === state.frontmostHeight)
        return
      state = { swipeProgress: nextProgress, frontmostHeight: nextHeight }
      listeners.forEach(l => l())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const openById = ref(new Map<string, boolean>())
const visualStateStore = createVisualStateStore()

const active = computed(() => {
  for (const open of openById.value.values()) {
    if (open)
      return true
  }
  return false
})

provideDrawerProviderContext({
  active,
  setDrawerOpen(id, open) {
    const prev = openById.value.get(id)
    if (prev === open)
      return
    const next = new Map(openById.value)
    next.set(id, open)
    openById.value = next
  },
  removeDrawer(id) {
    if (!openById.value.has(id))
      return
    const next = new Map(openById.value)
    next.delete(id)
    openById.value = next
  },
  visualStateStore,
})
</script>

<template>
  <slot />
</template>
