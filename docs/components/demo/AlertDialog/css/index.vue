<script setup lang="ts">
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
} from 'reka-ui'
import './styles.css'

function handleAction() {
  // eslint-disable-next-line no-alert
  alert('clicked action button!')
}
</script>

<template>
  <AlertDialogRoot>
    <AlertDialogTrigger class="Button green">
      Delete account
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay class="AlertDialogOverlay" />
      <AlertDialogContent class="AlertDialogContent">
        <AlertDialogTitle class="AlertDialogTitle">
          Are you absolutely sure?
        </AlertDialogTitle>
        <AlertDialogDescription class="AlertDialogDescription">
          This action cannot be undone. This will permanently delete your account and remove your data from our servers.
        </AlertDialogDescription>
        <div :style="{ display: 'flex', gap: 25, justifyContent: 'flex-end' }">
          <AlertDialogCancel class="Button mauve">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            class="Button red"
            @click="handleAction"
          >
            Yes, delete account
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
