<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot } from 'reka-ui'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const article = ref<HTMLElement>()
const open = ref(false)
const note = ref('')

/**
 * Floating UI accepts a virtual element — anything with `getBoundingClientRect`.
 * The rect is read fresh on every position update so the toolbar tracks the
 * selection while the page scrolls.
 */
const reference = shallowRef<{ getBoundingClientRect: () => DOMRect }>()

const actions = [
  { id: 'bold', label: 'Bold', icon: 'lucide:bold' },
  { id: 'italic', label: 'Italic', icon: 'lucide:italic' },
  { id: 'highlight', label: 'Highlight', icon: 'lucide:highlighter' },
  { id: 'link', label: 'Add link', icon: 'lucide:link' },
] as const

function syncToSelection() {
  const selection = document.getSelection()
  const range = selection && !selection.isCollapsed ? selection.getRangeAt(0) : undefined

  // Ignore selections that start outside the article, including the ones made
  // inside the toolbar itself.
  if (!range || !article.value?.contains(range.commonAncestorContainer)) {
    open.value = false
    return
  }

  reference.value = { getBoundingClientRect: () => range.getBoundingClientRect() }
  note.value = selection!.toString().trim()
  open.value = true
}

// Registered on mount rather than during setup: `document` does not exist while
// the page is server-rendered.
onMounted(() => document.addEventListener('selectionchange', syncToSelection))
onBeforeUnmount(() => document.removeEventListener('selectionchange', syncToSelection))

function apply(label: string) {
  note.value = `${label} applied to “${note.value.slice(0, 32)}${note.value.length > 32 ? '…' : ''}”`
  open.value = false
}
</script>

<template>
  <div class="flex w-full max-w-[520px] flex-col gap-3">
    <PopoverRoot v-model:open="open">
      <PopoverAnchor :reference="reference" />

      <p
        ref="article"
        class="select-text rounded-xl border border-muted bg-card p-5 text-sm leading-relaxed text-foreground"
      >
        Select any of this text. Headless components hand you behaviour and
        accessibility while leaving every pixel to you — which is exactly what
        makes a floating toolbar like this one possible without fighting a
        framework. The popover is anchored to the selection range rather than to
        any element in the document.
      </p>

      <PopoverPortal>
        <PopoverContent
          class="z-[100] flex items-center gap-0.5 rounded-lg border border-muted bg-card p-1 shadow-lg data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade"
          :side-offset="8"
          side="top"
          @open-auto-focus.prevent
          @close-auto-focus.prevent
        >
          <button
            v-for="action in actions"
            :key="action.id"
            type="button"
            class="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            :aria-label="action.label"
            @click="apply(action.label)"
          >
            <Icon
              :icon="action.icon"
              class="size-4"
            />
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <p class="min-h-4 text-xs text-muted-foreground">
      {{ note || 'Nothing selected yet.' }}
    </p>
  </div>
</template>
