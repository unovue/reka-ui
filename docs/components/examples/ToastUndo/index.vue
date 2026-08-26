<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { ref } from 'vue'

interface Mail {
  id: number
  from: string
  subject: string
  /** Stands in for a server that rejects the write — the row comes back. */
  locked?: boolean
}

interface Notification {
  id: number
  kind: 'undo' | 'error'
  mail: Mail
  open: boolean
  paused: boolean
  undone: boolean
}

const DURATION = 5000

const INBOX: Mail[] = [
  { id: 1, from: 'Ada Lovelace', subject: 'Analytical engine notes' },
  { id: 2, from: 'Grace Hopper', subject: 'Compiler review, round two' },
  { id: 3, from: 'Billing', subject: 'Invoice #4821', locked: true },
  { id: 4, from: 'Radia Perlman', subject: 'Spanning tree rollout' },
]

const inbox = ref<Mail[]>([...INBOX])
const notifications = ref<Notification[]>([])
let nextId = 0

function notify(kind: Notification['kind'], mail: Mail) {
  notifications.value.push({ id: ++nextId, kind, mail, open: true, paused: false, undone: false })
}

function restore(mail: Mail) {
  inbox.value = [...inbox.value, mail].sort((a, b) => a.id - b.id)
}

function archive(mail: Mail) {
  // Optimistic: the row leaves immediately and the toast owns the rollback.
  inbox.value = inbox.value.filter(item => item.id !== mail.id)
  notify('undo', mail)
}

function undo(notification: Notification) {
  // `ToastAction` closes the toast itself, so this only has to record that the
  // rollback happened — `handleOpenChange` reads the flag a tick later.
  notification.undone = true
  restore(notification.mail)
}

async function commit(mail: Mail) {
  await new Promise(resolve => setTimeout(resolve, 600))
  if (mail.locked) {
    restore(mail)
    notify('error', mail)
  }
}

function handleOpenChange(notification: Notification, open: boolean) {
  notification.open = open
  if (open)
    return

  // Deferred so the decision does not depend on whether this handler or the
  // Undo button's own click handler ran first — by now `undone` is settled.
  // It also lets the exit animation finish before the node is dropped.
  setTimeout(() => {
    // The toast closing without an undo *is* the commit signal.
    if (notification.kind === 'undo' && !notification.undone)
      commit(notification.mail)

    notifications.value = notifications.value.filter(item => item.id !== notification.id)
  }, 200)
}
</script>

<template>
  <ToastProvider
    :duration="DURATION"
    swipe-direction="right"
  >
    <div class="w-[340px] rounded-xl border border-muted bg-card p-2">
      <ul
        v-if="inbox.length"
        class="flex flex-col"
      >
        <li
          v-for="mail in inbox"
          :key="mail.id"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-foreground">{{ mail.subject }}</span>
            <span class="block truncate text-xs text-muted-foreground">{{ mail.from }}</span>
          </span>
          <button
            type="button"
            class="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/40 group-hover:opacity-100"
            :aria-label="`Archive ${mail.subject}`"
            @click="archive(mail)"
          >
            <Icon
              icon="lucide:archive"
              class="size-4"
            />
          </button>
        </li>
      </ul>
      <div
        v-else
        class="flex flex-col items-center gap-3 px-3 py-8 text-sm text-muted-foreground"
      >
        Inbox zero.
        <button
          type="button"
          class="rounded-md border border-muted px-3 py-1.5 text-xs text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          @click="inbox = [...INBOX]"
        >
          Refill inbox
        </button>
      </div>
    </div>

    <ToastRoot
      v-for="notification in notifications"
      :key="notification.id"
      class="ToastRoot relative grid grid-cols-[auto_max-content] items-center gap-x-3 overflow-hidden rounded-lg border border-muted bg-card p-3.5 shadow-lg data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
      :open="notification.open"
      :type="notification.kind === 'error' ? 'foreground' : 'background'"
      :data-paused="notification.paused || undefined"
      :style="{ '--toast-duration': `${DURATION}ms` }"
      @update:open="handleOpenChange(notification, $event)"
      @pause="notification.paused = true"
      @resume="notification.paused = false"
    >
      <ToastTitle class="text-sm font-medium text-foreground">
        {{ notification.kind === 'error' ? 'Could not archive' : 'Archived' }}
      </ToastTitle>
      <ToastDescription class="col-start-1 text-xs text-muted-foreground">
        {{ notification.mail.subject }}
      </ToastDescription>

      <ToastAction
        v-if="notification.kind === 'undo'"
        class="col-start-2 row-span-2 row-start-1"
        as-child
        alt-text="Undo archiving this message"
      >
        <button
          class="rounded-md border border-muted px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          @click="undo(notification)"
        >
          Undo
        </button>
      </ToastAction>
      <ToastClose
        v-else
        class="col-start-2 row-span-2 row-start-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="Dismiss"
      >
        <Icon
          icon="lucide:x"
          class="size-4"
        />
      </ToastClose>

      <!-- The bar is a plain CSS animation over the same duration, so it never
           drifts from the dismiss timer. `@pause`/`@resume` fire when the pointer
           enters the viewport or the window blurs — freezing both together. -->
      <span
        class="ToastCountdown absolute inset-x-0 bottom-0 h-0.5 origin-left"
        :class="notification.kind === 'error' ? 'bg-destructive' : 'bg-primary'"
      />
    </ToastRoot>

    <ToastViewport class="ToastViewport fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[380px] max-w-[100vw] list-none flex-col gap-2.5 p-6 outline-none" />
  </ToastProvider>
</template>

<style scoped>
.ToastCountdown {
  animation: toast-countdown var(--toast-duration) linear forwards;
}

.ToastRoot[data-paused] .ToastCountdown {
  animation-play-state: paused;
}

@keyframes toast-countdown {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* `--viewport-padding` is read by the slideIn/swipeOut keyframes. */
.ToastViewport {
  --viewport-padding: 24px;
}
</style>
