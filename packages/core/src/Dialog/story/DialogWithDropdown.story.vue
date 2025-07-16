<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from '..'
import DropdownMenu from '../../DropdownMenu/story/_DropdownMenu.vue'
</script>

<template>
  <Story
    title="Dialog/With Dropdown"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <DialogRoot>
        <DialogTrigger
          class="text-violet11 shadow-blackA7 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none"
        >
          Edit profile
        </DialogTrigger>
        <DialogPortal>
          <Transition name="fade">
            <DialogOverlay
              class="bg-blackA9 fixed inset-0"
            />
          </Transition>
          <Transition name="fade">
            <DialogContent
              class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
            >
              <DropdownMenu />
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
    </Variant>
  </Story>
</template>
