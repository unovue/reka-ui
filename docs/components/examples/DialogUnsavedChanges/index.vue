<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { computed, reactive, ref } from 'vue'

const saved = reactive({ title: 'Quarterly roadmap', summary: 'Ship the design system refresh.' })
const draft = reactive({ ...saved })

const open = ref(false)
const confirmOpen = ref(false)

const isDirty = computed(() =>
  draft.title !== saved.title || draft.summary !== saved.summary,
)

function openEditor(isOpen: boolean) {
  if (isOpen)
    Object.assign(draft, saved)
}

/**
 * Escape and outside-clicks are preventable, so a dirty form can hold the dialog
 * open and hand the decision to a confirmation instead. Without this the user's
 * edits would be gone before they knew the dialog was closing.
 */
function guardClose(event: Event) {
  if (!isDirty.value)
    return
  event.preventDefault()
  confirmOpen.value = true
}

/** The Cancel button routes through the same guard as Escape and outside-clicks. */
function requestClose() {
  if (isDirty.value)
    confirmOpen.value = true
  else
    open.value = false
}

function discard() {
  confirmOpen.value = false
  Object.assign(draft, saved)
  open.value = false
}

function save() {
  Object.assign(saved, draft)
  open.value = false
}

const fieldClass = 'w-full rounded-lg border border-muted bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40'
const buttonClass = 'inline-flex h-9 items-center rounded-lg border border-muted px-4 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40'
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <DialogRoot
      v-model:open="open"
      @update:open="openEditor"
    >
      <DialogTrigger :class="buttonClass">
        Edit document
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-30 bg-background/80 data-[state=open]:animate-overlayShow" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-[100] w-[90vw] max-w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-muted bg-card p-6 focus:outline-none data-[state=open]:animate-contentShow"
          @escape-key-down="guardClose"
          @interact-outside="guardClose"
        >
          <DialogTitle class="flex items-center gap-2 text-base font-semibold text-foreground">
            Edit document
            <span
              v-if="isDirty"
              class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
            >Unsaved</span>
          </DialogTitle>
          <DialogDescription class="mt-1 mb-4 text-sm text-muted-foreground">
            Change something, then press Escape or click outside.
          </DialogDescription>

          <form
            class="flex flex-col gap-3"
            @submit.prevent="save"
          >
            <label class="flex flex-col gap-1.5 text-sm">
              <span class="font-medium text-foreground">Title</span>
              <input
                v-model="draft.title"
                :class="fieldClass"
              >
            </label>
            <label class="flex flex-col gap-1.5 text-sm">
              <span class="font-medium text-foreground">Summary</span>
              <textarea
                v-model="draft.summary"
                rows="3"
                class="resize-none"
                :class="[fieldClass]"
              />
            </label>

            <div class="mt-2 flex justify-end gap-2">
              <button
                type="button"
                :class="buttonClass"
                @click="requestClose"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- A sibling of the dialog rather than a child: it has to outlive the
         moment the editor closes. -->
    <AlertDialogRoot v-model:open="confirmOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="fixed inset-0 z-[110] bg-background/80 data-[state=open]:animate-overlayShow" />
        <AlertDialogContent class="fixed left-1/2 top-1/2 z-[120] w-[90vw] max-w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-muted bg-card p-5 focus:outline-none data-[state=open]:animate-contentShow">
          <AlertDialogTitle class="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon
              icon="lucide:triangle-alert"
              class="size-4 text-destructive"
            />
            Discard changes?
          </AlertDialogTitle>
          <AlertDialogDescription class="mt-2 mb-4 text-sm text-muted-foreground">
            You have unsaved edits to “{{ saved.title }}”. Closing now will lose them.
          </AlertDialogDescription>
          <div class="flex justify-end gap-2">
            <AlertDialogCancel :class="buttonClass">
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              class="inline-flex h-9 items-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-destructive/40"
              @click="discard"
            >
              Discard
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <p class="text-xs text-muted-foreground">
      Saved: {{ saved.title }} — {{ saved.summary }}
    </p>
  </div>
</template>
