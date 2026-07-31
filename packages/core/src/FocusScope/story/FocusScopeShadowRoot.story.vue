<script setup lang="ts">
import { ref } from 'vue'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import ShadowRootContainer from './ShadowRootContainer.vue'

const dialogOpen = ref(false)
</script>

<template>
  <Story
    group="utilities"
    title="FocusScope/ShadowRoot"
  >
    <Variant title="Select inside Dialog inside a shadow root">
      <div class="h-[150vh]">
        <ul class="list-disc ml-4 mb-8">
          <li>✅ opening the Select must move focus into its content, not get yanked back to the Dialog</li>
          <li>✅ closing the Select returns focus to its trigger, still inside the Dialog's trap</li>
          <li>✅ Tab still cycles only within the Dialog while it's open</li>
        </ul>

        <ShadowRootContainer v-slot="{ mountPoint }">
          <DialogRoot v-model:open="dialogOpen">
            <DialogTrigger class="border rounded px-3 py-2">
              Open Dialog (in shadow root)
            </DialogTrigger>
            <DialogPortal :to="mountPoint">
              <DialogOverlay class="fixed inset-0 bg-black/50" />
              <DialogContent
                data-testid="dialog-content"
                class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg min-w-[320px]"
              >
                <DialogTitle class="font-medium mb-4">
                  Dialog (shadow root)
                </DialogTitle>

                <SelectRoot>
                  <SelectTrigger
                    data-testid="select-trigger"
                    class="border rounded px-3 py-2"
                  >
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectPortal :to="mountPoint">
                    <SelectContent
                      data-testid="select-content"
                      class="bg-white border rounded shadow-md"
                      position="popper"
                    >
                      <SelectViewport class="p-2">
                        <SelectItem
                          value="apple"
                          class="px-2 py-1 outline-none focus:bg-orange-100"
                        >
                          Apple
                        </SelectItem>
                        <SelectItem
                          value="banana"
                          class="px-2 py-1 outline-none focus:bg-orange-100"
                        >
                          Banana
                        </SelectItem>
                      </SelectViewport>
                    </SelectContent>
                  </SelectPortal>
                </SelectRoot>

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
