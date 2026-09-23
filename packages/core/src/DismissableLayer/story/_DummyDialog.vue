<script setup lang="ts">
import { ref } from 'vue'
import { FocusGuards } from '@/FocusGuards'
import { FocusScope } from '@/FocusScope'
import { DismissableLayer } from '..'

defineProps<{
  openLabel?: string
  closeLabel?: string
}>()

const open = ref(false)
</script>

<template>
  <button
    class="py-2 rounded bg-gray-500 focus:outline focus:outline-blue-500"
    type="button"
    @click="open = !open"
  >
    {{ openLabel }}
  </button>

  <template v-if="open">
    <FocusGuards>
      <Teleport to="body">
        <div
          class="fixed top-0 left-0 bottom-0 right-0 pointer-event-none bg-black/30"
        />
      </Teleport>

      <Teleport to="body">
        <DismissableLayer
          disable-outside-pointer-events
          as-child
          @dismiss="open = false"
        >
          <FocusScope
            trapped
            class="flex items-start gap-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white min-w-[300px] min-height-[200px] rounded-lg p-8 bg-white shadow-xl"
          >
            <slot />
            <button
              type="button"
              @click="open = false"
            >
              {{ closeLabel }}
            </button>
            <input
              type="text"
              value="Hello world"
            >
          </FocusScope>
        </DismissableLayer>
      </Teleport>
    </FocusGuards>
  </template>
</template>
