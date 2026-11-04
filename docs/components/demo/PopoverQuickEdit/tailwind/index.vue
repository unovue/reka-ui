<script setup lang="ts">
import type { ChangeEventDetails, PopoverOpenChangeReason } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { ref } from 'vue'

const title = ref('Quarterly roadmap')
const draft = ref(title.value)
const open = ref(false)
const lastClose = ref<PopoverOpenChangeReason | 'imperative-action'>()

function onOpenChange(isOpen: boolean, details: ChangeEventDetails<PopoverOpenChangeReason>) {
  if (isOpen) {
    draft.value = title.value
    return
  }
  // Escape, a click outside or the Cancel button discard the draft;
  // only the form's submit (an imperative close) keeps it.
  lastClose.value = details.reason
}

function save() {
  title.value = draft.value.trim() || title.value
  open.value = false
  lastClose.value = 'imperative-action'
}
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <PopoverRoot
      v-model:open="open"
      @update:open="onOpenChange"
    >
      <div class="flex items-center gap-2">
        <span
          class="text-sm font-medium text-foreground"
          data-testid="title"
        >{{ title }}</span>
        <PopoverTrigger
          class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Rename"
        >
          <Icon
            icon="radix-icons:pencil-1"
            class="h-4 w-4"
          />
        </PopoverTrigger>
      </div>

      <PopoverPortal>
        <PopoverContent
          side="bottom"
          :side-offset="6"
          class="z-[100] w-64 rounded-lg border border-muted bg-card p-3 shadow-sm data-[state=open]:data-[side=bottom]:animate-slideUpAndFade"
        >
          <form
            class="flex flex-col gap-2"
            @submit.prevent="save"
          >
            <label class="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              Title
              <input
                v-model="draft"
                class="h-8 rounded-md border border-muted bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              >
            </label>
            <div class="flex justify-end gap-2">
              <PopoverClose class="h-8 rounded-md border border-muted px-3 text-xs font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                Cancel
              </PopoverClose>
              <button
                type="submit"
                class="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Save
              </button>
            </div>
          </form>
          <PopoverArrow class="fill-card stroke-muted" />
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <p
      v-if="lastClose"
      class="text-xs text-muted-foreground"
      data-testid="last-close"
    >
      Last closed by <code>{{ lastClose }}</code>
    </p>
  </div>
</template>
