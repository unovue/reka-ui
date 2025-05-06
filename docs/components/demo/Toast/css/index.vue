<script setup lang="ts">
import { ToastAction, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const open = ref(false)
const eventDateRef = ref(new Date())
const timerRef = ref(0)

function oneWeekAway() {
  const now = new Date()
  const inOneWeek = now.setDate(now.getDate() + 7)
  return new Date(inOneWeek)
}

function prettyDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(date)
}

function handleClick() {
  open.value = false
  window.clearTimeout(timerRef.value)
  timerRef.value = window.setTimeout(() => {
    eventDateRef.value = oneWeekAway()
    open.value = true
  }, 100)
}
</script>

<template>
  <ToastProvider>
    <button
      class="Button large grass"
      @click="handleClick"
    >
      Add to calendar
    </button>

    <ToastRoot
      v-model:open="open"
      class="ToastRoot"
    >
      <ToastTitle class="ToastTitle">
        Scheduled: Catch up
      </ToastTitle>
      <ToastDescription as-child>
        <time
          class="ToastDescription"
          :dateTime="eventDateRef.toISOString()"
        >
          {{ prettyDate(eventDateRef) }}
        </time>
      </ToastDescription>
      <ToastAction
        class="ToastAction"
        as-child
        alt-text="Goto schedule to undo"
      >
        <button class="Button small green">
          Undo
        </button>
      </ToastAction>
    </ToastRoot>
    <ToastViewport class="ToastViewport" />
  </ToastProvider>
</template>
