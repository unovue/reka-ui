<script setup lang="ts">
import { ref } from 'vue'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { PopperAnchor, PopperContent, PopperRoot } from '@/Popper'
import { DismissableLayer } from '..'
import ShadowRootContainer from './ShadowRootContainer.vue'

const dialogOpen = ref(false)
const popoverOpen = ref(false)
</script>

<template>
  <Story
    group="utilities"
    title="DismissableLayer/ShadowRoot"
  >
    <Variant title="Popover inside Dialog inside a shadow root">
      <div class="h-[150vh]">
        <ul class="list-disc ml-4 mb-8">
          <li>✅ clicking inside the Popover must NOT close the Dialog (the originally reported bug)</li>
          <li>✅ clicking the Dialog overlay still closes the Dialog</li>
          <li>✅ Escape closes only the Popover while it's open, then the Dialog on a second press</li>
        </ul>

        <ShadowRootContainer v-slot="{ mountPoint }">
          <DialogRoot v-model:open="dialogOpen">
            <DialogTrigger class="border rounded px-3 py-2">
              Open Dialog (in shadow root)
            </DialogTrigger>
            <DialogPortal :to="mountPoint">
              <DialogOverlay
                data-testid="dialog-overlay"
                class="fixed inset-0 bg-black/50"
              />
              <DialogContent
                data-testid="dialog-content"
                class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg min-w-[320px]"
              >
                <DialogTitle class="font-medium mb-4">
                  Dialog (shadow root)
                </DialogTitle>

                <PopperRoot>
                  <PopperAnchor as-child>
                    <button
                      class="border rounded px-3 py-2"
                      @click="popoverOpen = !popoverOpen"
                    >
                      Open Popover
                    </button>
                  </PopperAnchor>
                  <DismissableLayer
                    v-if="popoverOpen"
                    as-child
                    @dismiss="popoverOpen = false"
                  >
                    <PopperContent
                      data-testid="popover-content"
                      class="bg-orange-100 border border-orange-400 rounded p-4 min-w-[200px]"
                      side="bottom"
                      :side-offset="8"
                    >
                      Popover content — clicking here must not close the Dialog.
                      <input
                        type="text"
                        class="border rounded px-2 py-1 mt-2 w-full"
                        placeholder="type here"
                      >
                    </PopperContent>
                  </DismissableLayer>
                </PopperRoot>

                <DialogClose class="mt-4 border rounded px-3 py-2">
                  Close
                </DialogClose>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </ShadowRootContainer>
      </div>
    </Variant>
  </Story>
</template>
