<script setup lang="ts">
import { ref } from 'vue'
import { DismissableLayer } from '..'
import DummyDialog from './_DummyDialog.vue'
import DummyPopover from './_DummyPopover.vue'

function handleAlert() {
  // eslint-disable-next-line no-alert
  alert('Alert')
}

const open = ref(false)
</script>

<template>
  <Story
    group="utilities"
    title="DismissableLayer/Dialog"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Dialog (fully modal example)">
      <div class="h-[300vh]">
        <ul class="list-disc ml-4">
          <li>✅ focus should move inside `Dialog` when mounted</li>
          <li>✅ focus should be trapped inside `Dialog`</li>
          <li>✅ scrolling outside `Dialog` should be disabled</li>
          <li>✅ should be able to dismiss `Dialog` on pressing escape</li>
          <li class="ml-6">
            ✅ focus should return to the open button
          </li>
          <li>
            ✅ interacting outside `Dialog` should be disabled (clicking the
            "alert me" button shouldn't do anything)
          </li>
          <li>➕</li>
          <li>
            ✅ should be able to dismiss `Dialog` when interacting outside
          </li>
          <li class="ml-6">
            ✅ focus should return to the open button
          </li>
        </ul>

        <div class="flex flex-col gap-4 mt-12">
          <DummyDialog
            open-label="Open Dialog"
            close-label="Close dialog"
          />

          <input
            type="text"
            value="some input"
          >
          <button @click="handleAlert">
            Alert me
          </button>
        </div>
      </div>
    </Variant>

    <Variant title="Popover (fully modal example)">
      <div class="h-[300vh]">
        <ul class="list-disc ml-4">
          <li>✅ focus should move inside `Popover` when mounted</li>
          <li>✅ focus should be trapped inside `Popover`</li>
          <li>✅ scrolling outside `Popover` should be disabled</li>
          <li>✅ should be able to dismiss `Popover` on pressing escape</li>
          <li class="ml-6">
            ✅ focus should return to the open button
          </li>
          <li>
            ✅ interacting outside `Popover` should be disabled (clicking the
            "alert me" button shouldn't do anything)
          </li>
          <li>➕</li>
          <li>
            ✅ should be able to dismiss `Popover` when interacting outside
          </li>
          <li class="ml-6">
            ✅ focus should return to the open button
          </li>
        </ul>

        <div class="flex flex-col gap-4 mt-12">
          <DummyPopover
            open-label="Open Popover"
            close-label="Close Popover"
            disable-outside-pointer-events
          />

          <input
            type="text"
            value="some input"
          >
          <button @click="handleAlert">
            Alert me
          </button>
        </div>
      </div>
    </Variant>
    <Variant title="Dialog (with scrollbar)">
      <div class="flex flex-col gap-4">
        <button
          class="py-2 rounded bg-gray-500 focus:outline focus:outline-blue-500"
          type="button"
          @click="open = !open"
        >
          Open layer
        </button>

        <template v-if="open">
          <Teleport to="body">
            <div
              class="fixed top-0 left-0 bottom-0 right-0 pointer-event-none bg-black/30 flex items-center justify-center overflow-y-auto"
            >
              <DismissableLayer @dismiss="open = false">
                <div class="h-[200vh] text-white flex items-center justify-center p-16 bg-gray-700">
                  Long content. Clicking on scrollbar shouldn't dismiss the layer
                </div>
              </DismissableLayer>
            </div>
          </Teleport>
        </template>
      </div>
    </Variant>
  </Story>
</template>
