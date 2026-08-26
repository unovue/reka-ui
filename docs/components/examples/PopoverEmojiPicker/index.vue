<script setup lang="ts">
import type { Emoji } from './emoji'
import { Icon } from '@iconify/vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger, RovingFocusGroup, RovingFocusItem } from 'reka-ui'
import { computed, ref } from 'vue'
import { COLUMNS, emojis } from './emoji'

const open = ref(false)
const query = ref('')
const recent = ref<Emoji[]>([])
const hovered = ref<Emoji>()

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? emojis.filter(emoji => emoji.name.includes(q)) : emojis
})

/**
 * RovingFocusGroup only maps the axis it is given, so a horizontal group walks
 * the flat list with Left/Right and leaves Up/Down free. Wiring those to a jump
 * of one row is all a visual grid needs to become navigable in two dimensions.
 */
function handleGridKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
    return

  const cells = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[data-emoji]')]
  const index = cells.indexOf(document.activeElement as HTMLElement)
  const next = cells[index + (event.key === 'ArrowDown' ? COLUMNS : -COLUMNS)]
  if (index === -1 || !next)
    return

  event.preventDefault()
  next.focus()
}

function pick(emoji: Emoji) {
  recent.value = [emoji, ...recent.value.filter(item => item.char !== emoji.char)].slice(0, COLUMNS)
  open.value = false
}

const cellClass = 'grid size-8 place-items-center rounded-md text-xl leading-none outline-none hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-primary/40'
</script>

<template>
  <PopoverRoot
    v-model:open="open"
    @update:open="$event && (query = '')"
  >
    <PopoverTrigger class="inline-flex h-9 items-center gap-2 rounded-lg border border-muted bg-card px-3 text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40">
      <span class="text-base leading-none">{{ recent[0]?.char ?? '🙂' }}</span>
      Add reaction
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="z-[100] w-[19rem] rounded-xl border border-muted bg-card p-2 shadow-lg data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade"
        :side-offset="6"
      >
        <div class="mb-2 flex items-center gap-1.5 rounded-lg border border-muted px-2">
          <Icon
            icon="lucide:search"
            class="size-3.5 shrink-0 text-muted-foreground"
          />
          <input
            v-model="query"
            class="w-full bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search emoji…"
          >
        </div>

        <template v-if="recent.length">
          <p class="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recent
          </p>
          <div class="mb-2 flex gap-0.5">
            <button
              v-for="emoji in recent"
              :key="emoji.char"
              type="button"
              :class="cellClass"
              :aria-label="emoji.name"
              @click="pick(emoji)"
            >
              {{ emoji.char }}
            </button>
          </div>
        </template>

        <RovingFocusGroup
          v-if="filtered.length"
          class="grid max-h-[13rem] grid-cols-8 gap-0.5 overflow-y-auto"
          orientation="horizontal"
          @keydown="handleGridKeydown"
        >
          <RovingFocusItem
            v-for="emoji in filtered"
            :key="emoji.char"
            as-child
          >
            <button
              type="button"
              data-emoji
              :class="cellClass"
              :aria-label="emoji.name"
              @click="pick(emoji)"
              @focus="hovered = emoji"
              @mouseenter="hovered = emoji"
            >
              {{ emoji.char }}
            </button>
          </RovingFocusItem>
        </RovingFocusGroup>
        <p
          v-else
          class="px-2 py-8 text-center text-sm text-muted-foreground"
        >
          No emoji matches “{{ query }}”
        </p>

        <p class="mt-2 truncate border-t border-muted px-1 pt-2 text-xs text-muted-foreground">
          {{ hovered ? `${hovered.char}  ${hovered.name}` : 'Arrow keys move in both directions.' }}
        </p>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
