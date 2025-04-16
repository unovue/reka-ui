<script setup lang="ts">
import { ref } from 'vue'
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from '..'

const open = ref(false)
</script>

<template>
  <Story
    title="Popover/Trigger change"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <PopoverRoot v-model:open="open">
        <PopoverTrigger
          class="rounded-full w-[35px] h-[35px] inline-flex items-center justify-center text-violet11 bg-white shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black cursor-default outline-none"
          aria-label="Update dimensions"
          as-child
        >
          <button v-if="!open">
            Closed
          </button>
          <button v-else>
            Open
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            :side-offset="5"
            :style="{
              boxSizing: 'border-box',
              borderRadius: '8px',
              padding: '8px',
              color: 'white',
              backgroundColor: 'black',
            }"
          >
            The content stays correctly positioned event after the buttons are changed.
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </Variant>
  </Story>
</template>
