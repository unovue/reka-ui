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

import { toast, Toaster } from 'vue-sonner'
</script>

<template>
  <div>
    <DialogRoot>
      <DialogTrigger
        class="text-grass11 font-semibold shadow-blackA7 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none"
      >
        Open Dialog
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay class="bg-blackA9 data-[state=open]:animate-overlayShow fixed inset-0 z-30" />
        <DialogContent
          class="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-[100]"
          @interact-outside="event => {
            const target = event.target as HTMLElement;
            if (target?.closest('[data-sonner-toaster]')) return event.preventDefault()
          }"
        >
          <DialogTitle class="text-mauve12 m-0 text-[17px] font-semibold">
            Dialog Title
          </DialogTitle>
          <DialogDescription class="text-mauve11 mt-[10px] mb-5 text-sm leading-normal">
            Dialog description
          </DialogDescription>

          <button
            class="bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-semibold leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
            @click="() => toast('Event has been created', {
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
              },
            })"
          >
            Give me a toast
          </button>

          <DialogClose
            class="text-grass11 hover:bg-green4 focus:shadow-green7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
            aria-label="Close"
          >
            <Icon icon="lucide:x" />
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <ClientOnly>
      <Teleport to="html">
        <Toaster />
      </Teleport>
    </ClientOnly>
  </div>
</template>
