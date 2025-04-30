<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import './styles.css'
</script>

<template>
  <DialogRoot>
    <DialogTrigger
      class="Button grass"
    >
      Edit profile
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="DialogOverlay" />
      <DialogContent
        class="DialogContent"
      >
        <DialogTitle class="DialogTitle">
          Edit profile
        </DialogTitle>
        <DialogDescription class="DialogDescription">
          Make changes to your profile here. Click save when you're done.
        </DialogDescription>
        <fieldset class="Fieldset">
          <label
            class="Label"
            for="name"
          > Name </label>
          <input
            id="name"
            class="Input"
            defaultValue="Pedro Duarte"
          >
        </fieldset>
        <fieldset class="Fieldset">
          <label
            class="Label"
            for="username"
          > Username </label>
          <input
            id="username"
            class="Input"
            defaultValue="@peduarte"
          >
        </fieldset>
        <div :style="{ display: 'flex', marginTop: 25, justifyContent: 'flex-end' }">
          <DialogClose as-child>
            <button
              class="Button green"
            >
              Save changes
            </button>
          </DialogClose>
        </div>
        <DialogClose
          class="IconButton"
          aria-label="Close"
        >
          <Icon icon="lucide:x" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
