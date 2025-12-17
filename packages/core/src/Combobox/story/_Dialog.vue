<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxLabel, ComboboxRoot, ComboboxSeparator, ComboboxTrigger, ComboboxViewport } from '..'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '../../Dialog'

import ComboboxManualFilter from './_ComboboxManualFilter.vue'

defineProps<{ dialogPortalTarget: HTMLDivElement }>()
const v = ref('Apple')
const searchTerm = ref('')
const options = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
const vegetables = ['Aubergine', 'Broccoli', 'Carrot', 'Courgette', 'Leek']

const dialogOpen = ref(false)
</script>

<template>
  <DialogRoot v-model:open="dialogOpen">
    <DialogTrigger
      class="text-violet11 shadow-blackA7 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none"
    >
      Edit profile
    </DialogTrigger>
    <DialogPortal :to="dialogPortalTarget">
      <Transition name="fade">
        <DialogOverlay
          class="bg-blackA9 fixed inset-0"
        />
      </Transition>
      <Transition name="fade">
        <DialogContent
          :is-escape-key-down-default="true"
          class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
          @pointer-down-outside.prevent
        >
          <DialogTitle class="text-mauve12 m-0 text-[17px] font-medium">
            Edit profile
          </DialogTitle>
          <ComboboxManualFilter />
          <div class="flex flex-col">
            <button @click="v = 'Banana'">
              Set search term {{ searchTerm }} to "Banana"
            </button>
            <ComboboxRoot
              v-model="v"
              ignore-filter
            >
              <ComboboxAnchor class="w-full min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
                <ComboboxInput
                  v-model="searchTerm"
                  class=" bg-transparent w-full outline-none text-grass11 placeholder-gray-400"
                  placeholder="Test"
                />
                <ComboboxTrigger>
                  <Icon
                    icon="radix-icons:chevron-down"
                    class="h-4 w-4 text-grass11"
                  />
                </ComboboxTrigger>
              </ComboboxAnchor>
              <ComboboxContent class="mt-2 min-w-[160px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
                <ComboboxViewport class="p-[5px]">
                  <ComboboxGroup>
                    <ComboboxLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
                      Fruits
                    </ComboboxLabel>

                    <ComboboxItem
                      v-for="(option, index) in options"
                      :key="index"
                      class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                      :value="option"
                    >
                      <ComboboxItemIndicator
                        class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                      >
                        <Icon icon="radix-icons:check" />
                      </ComboboxItemIndicator>
                      <span>
                        {{ option }}
                      </span>
                    </ComboboxItem>
                    <ComboboxSeparator class="h-[1px] bg-grass6 m-[5px]" />
                  </ComboboxGroup>

                  <ComboboxGroup>
                    <ComboboxLabel
                      class="px-[25px] text-xs leading-[25px] text-mauve11"
                    >
                      Vegetables
                    </ComboboxLabel>
                    <ComboboxItem
                      v-for="(option, index) in vegetables"
                      :key="index"
                      class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                      :value="option"
                    >
                      <ComboboxItemIndicator
                        class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                      >
                        <Icon icon="radix-icons:check" />
                      </ComboboxItemIndicator>
                      <span>
                        {{ option }}
                      </span>
                    </ComboboxItem>
                  </ComboboxGroup>
                </ComboboxViewport>
              </ComboboxContent>
            </ComboboxRoot>
          </div>
          <div class="mt-[25px] flex justify-end">
            <DialogClose as-child>
              <button
                class="bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
              >
                Save changes
              </button>
            </DialogClose>
          </div>
          <DialogClose
            class="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
            aria-label="Close"
          >
            <Icon icon="lucide:x" />
          </DialogClose>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
