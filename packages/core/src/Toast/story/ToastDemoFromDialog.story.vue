<script setup lang="ts">
import { ref } from 'vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { ToastAction, ToastDescription, ToastProvider, ToastRoot, ToastViewport } from '..'

const open = ref(false)
</script>

<template>
  <Story
    title="Toast/From Dialog"
    :layout="{ type: 'single', iframe: false }"
  >
    <ToastProvider>
      <DialogRoot>
        <DialogTrigger class="inline-flex items-center justify-center rounded font-medium text-[15px] px-[15px] leading-[35px] h-[35px] bg-white text-violet11 shadow-[0_2px_10px] shadow-blackA7 outline-none hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black">
          Open
        </DialogTrigger>
        <DialogOverlay />
        <DialogContent :style="{ border: '1px solid', width: 300, padding: 30 }">
          <DialogTitle :style="{ margin: 0 }">
            Title
          </DialogTitle>
          <DialogDescription>Description</DialogDescription>
          <button
            class="inline-flex items-center justify-center rounded font-medium text-[15px] px-[15px] leading-[35px] h-[35px] bg-white text-violet11 shadow-[0_2px_10px] shadow-blackA7 outline-none hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black"
            @click="open = true"
          >
            Open toast
          </button>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </DialogRoot>

      <ToastRoot
        v-model:open="open"
        class="flex items-center space-between pointer-events-auto"
      >
        <ToastDescription>There was an error</ToastDescription>
        <ToastAction
          class="inline-flex items-center justify-center rounded font-medium text-[15px] px-[15px] leading-[35px] h-[35px] bg-white text-violet11 shadow-[0_2px_10px] shadow-blackA7 outline-none hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black"
          alt-text="Resubmit the form to try again."
          @click="() => {
            console.log('try again')
          }"
        >
          Try again
        </ToastAction>
      </ToastRoot>

      <ToastViewport class="fixed top-1/2 right-1/2 border flex flex-col overflow-hidden" />
    </ToastProvider>
  </Story>
</template>
