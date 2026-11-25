<script setup vapor lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from '#reka'
import { ref } from 'vue'

const popover = ref(false)
const dialog = ref(false)
const alert = ref(false)
const actions = ref(0)
</script>

<template>
  <div style="padding: 40px">
    <PopoverRoot v-model:open="popover">
      <!-- asChild, template form -->
      <PopoverTrigger as-child>
        <button
          id="popover-trigger"
          data-state="mine"
        >
          More
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          id="popover-content"
          side="bottom"
          :side-offset="4"
          style="background: #eee; padding: 8px"
        >
          <input
            id="popover-input"
            aria-label="Name"
          >
          <PopoverClose
            id="popover-close"
            aria-label="Close"
          >
            x
          </PopoverClose>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
  <span id="popover">{{ popover }}</span>
  <div
    id="outside"
    style="height: 40px"
  >
    outside
  </div>

  <DialogRoot v-model:open="dialog">
    <!-- asChild, v-slot form -->
    <DialogTrigger
      v-slot="{ props }"
      as-child
    >
      <button
        v-bind="props"
        id="dialog-trigger"
      >
        Edit
      </button>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay
        id="dialog-overlay"
        style="position: fixed; inset: 0; background: rgba(0,0,0,.3)"
      />
      <DialogContent
        id="dialog-content"
        style="position: fixed; top: 30%; left: 30%; background: white; padding: 16px"
      >
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>Change your name</DialogDescription>
        <input
          id="dialog-input"
          aria-label="Name"
        >
        <DialogClose
          id="dialog-close"
          aria-label="Close"
        >
          x
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <span id="dialog">{{ dialog }}</span>

  <AlertDialogRoot v-model:open="alert">
    <AlertDialogTrigger id="alert-trigger">
      Delete
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay style="position: fixed; inset: 0; background: rgba(0,0,0,.3)" />
      <AlertDialogContent
        id="alert-content"
        style="position: fixed; top: 30%; left: 30%; background: white; padding: 16px"
      >
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone</AlertDialogDescription>
        <AlertDialogCancel id="alert-cancel">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          id="alert-action"
          @click="actions++"
        >
          Delete
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
  <span id="alert">{{ alert }}</span>
  <span id="actions">{{ actions }}</span>
</template>
