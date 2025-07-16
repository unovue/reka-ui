<script setup lang="ts">
import { ref } from 'vue'
import { DialogContent, DialogOverlay, DialogRoot } from '..'

const dialogAOpen = ref(false)
const dialogBOpen = ref(false)

function openA() {
  dialogBOpen.value = false
  dialogAOpen.value = true
}
function openB() {
  dialogAOpen.value = false
  dialogBOpen.value = true
}
function closeA(opened: boolean) {
  if (opened)
    dialogAOpen.value = false
}
function closeB(opened: boolean) {
  if (opened)
    dialogBOpen.value = false
}
</script>

<template>
  <Story
    title="Dialog/Programmatic"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="h-[300vh]">
        <button
          class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
          @click="openA"
        >
          Open A
        </button>
        <div v-if="dialogAOpen">
          <DialogRoot
            v-model:open="dialogAOpen"
            @update:open="closeA"
          >
            <DialogOverlay class="bg-blackA9 fixed inset-0" />
            <DialogContent
              class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px]"
            >
              <h1>Dialog A</h1>
              <button
                class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
                @click="openB"
              >
                Open B
              </button>
            </DialogContent>
          </DialogRoot>
        </div>
        <div v-if="dialogBOpen">
          <DialogRoot
            v-model:open="dialogBOpen"
            @update:open="closeB"
          >
            <DialogOverlay class="bg-blackA9 fixed inset-0" />
            <DialogContent
              class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px]"
            >
              <h1>Dialog B</h1>
              <button
                class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
                @click="openA"
              >
                Open A
              </button>
            </DialogContent>
          </DialogRoot>
        </div>
      </div>
    </Variant>
  </Story>
</template>
