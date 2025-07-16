<script setup lang="ts">
import { ToastAction, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '..'
import { useToast } from './_useToast'

const { toast: addToast, toasts } = useToast()
</script>

<template>
  <Story
    title="Toast/Multiple"
    :layout="{ type: 'single', iframe: false }"
  >
    <ToastProvider swipe-direction="left">
      <button
        class="inline-flex items-center justify-center rounded font-medium text-[15px] px-[15px] leading-[35px] h-[35px] bg-white text-violet11 shadow-[0_2px_10px] shadow-blackA7 outline-none hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black"
        @click="addToast({
          description: 'hi',
        })"
      >
        Add toast
      </button>

      <ToastRoot
        v-for="toast in toasts"
        :key="toast.id"
        v-bind="toast"
        v-slot="{ remaining }"
        class="bg-gray-500 rounded-md shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] p-[15px] grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-[15px] items-center data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
        @update:open="toast.onOpenChange"
      >
        <ToastTitle class="[grid-area:_title] mb-[5px] font-medium text-slate12 text-[15px]">
          Title
        </ToastTitle>
        <ToastDescription>
          Remaining {{ remaining }}
        </ToastDescription>
        <ToastAction
          class="[grid-area:_action]"
          as-child
          alt-text="Goto schedule to undo"
        >
          <button class="inline-flex items-center justify-center rounded font-medium text-xs px-[10px] leading-[25px] h-[25px] bg-green2 text-green11 shadow-[inset_0_0_0_1px] shadow-green7 hover:shadow-[inset_0_0_0_1px] hover:shadow-green8 focus:shadow-[0_0_0_2px] focus:shadow-green8">
            Undo
          </button>
        </ToastAction>
      </ToastRoot>
      <ToastViewport class="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[10px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
    </ToastProvider>
  </Story>
</template>
