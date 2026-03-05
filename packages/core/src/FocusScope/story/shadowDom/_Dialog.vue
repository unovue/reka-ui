<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,

} from '../../../Dialog'

import FocusableLayersElements from './FocusableLayersElements.vue'
import ShadowRootContainer from './ShadowRootContainer.vue'

defineProps<{ portalTarget?: HTMLDivElement, hasShadowRootInside?: boolean }>()

const dialogOpen = ref(false)
</script>

<template>
  <div class="w-100 flex justify-center">
    <DialogRoot v-model:open="dialogOpen">
      <DialogTrigger
        data-testid="dialog-trigger"
        class="text-violet11 shadow-blackA7 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none"
      >
        Main Trigger
      </DialogTrigger>
      <DialogPortal :to="portalTarget">
        <Transition name="fade">
          <DialogOverlay
            data-testid="dialog-overlay"
            class="bg-blackA9 fixed inset-0"
          />
        </Transition>
        <Transition name="fade">
          <DialogContent
            data-testid="dialog-content"
            class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[750px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
          >
            <DialogTitle class="text-mauve12 m-0 text-[17px] font-medium">
              Edit profile
            </DialogTitle>

            <template v-if="hasShadowRootInside">
              <ShadowRootContainer :with-dialog="false" />
            </template>
            <template v-else>
              <FocusableLayersElements />
            </template>

            <DialogClose
              data-testid="dialog-close"
              class="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
              aria-label="Close"
            >
              <Icon icon="lucide:x" />
            </DialogClose>
          </DialogContent>
        </Transition>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
