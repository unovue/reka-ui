<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogRoot, DialogTrigger } from '..'
</script>

<template>
  <Story
    title="Dialog/ProgrammaticClose"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="h-[300vh]">
        <DialogRoot
          v-slot="{ close }"
        >
          <DialogTrigger>
            <button
              class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
            >
              Open A
            </button>
          </DialogTrigger>
          <DialogOverlay class="bg-blackA9 fixed inset-0" />
          <DialogContent
            class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px]"
          >
            <h1>Dialog A</h1>

            <button
              class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
              @click="close"
            >
              Close A
            </button>
          </DialogContent>
        </DialogRoot>
      </div>
    </Variant>

    <Variant title="Nested">
      <div class="h-[300vh]">
        <DialogRoot
          v-slot="{ close: closeA }"
        >
          <DialogTrigger>
            <button
              class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
            >
              Open A
            </button>
          </DialogTrigger>
          <DialogOverlay class="bg-blackA9 fixed inset-0" />
          <DialogContent
            class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px]"
          >
            <h1>Dialog A</h1>

            <button
              class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
              @click="closeA"
            >
              Close A
            </button>

            <DialogRoot v-slot="{ close: closeB }">
              <DialogTrigger>
                <button
                  class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
                >
                  Open B
                </button>
              </DialogTrigger>
              <DialogOverlay class="bg-blackA9 fixed inset-0" />
              <DialogContent
                class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px]"
              >
                <h1>Dialog B</h1>
                <button
                  class="text-black9 bg-blackA9 hover:bg-blackA10 rounded-[4px] text-white p-2"
                  @click="closeB"
                >
                  Close B
                </button>
              </DialogContent>
            </DialogRoot>
          </DialogContent>
        </DialogRoot>
      </div>
    </Variant>
  </Story>
</template>
