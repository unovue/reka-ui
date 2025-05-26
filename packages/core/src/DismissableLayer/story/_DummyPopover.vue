<script setup lang="ts">
import { ref } from 'vue'
import { FocusScope } from '@/FocusScope'
import { PopperAnchor, PopperArrow, PopperContent, PopperRoot } from '@/Popper'
import { DismissableLayer } from '..'

withDefaults(
  defineProps<{
    openLabel?: string
    closeLabel?: string
    trapped?: boolean
    disableOutsidePointerEvents?: boolean
    color?: string
  }>(),
  {
    openLabel: 'Open',
    closeLabel: 'Close',
    trapped: false,
    disableOutsidePointerEvents: false,
    color: 'white',
  },
)

const open = ref(false)
const openButtonRef = ref()
</script>

<template>
  <PopperRoot>
    <PopperAnchor as-child>
      <button
        ref="openButtonRef"
        type="button"
        class="py-2 rounded bg-gray-500 focus:outline focus:outline-blue-500"
        @click="open = !open"
      >
        {{ openLabel }}
      </button>
    </PopperAnchor>

    <Teleport
      v-if="open"
      to="body"
    >
      <DismissableLayer
        as-child
        :disable-outside-pointer-events="disableOutsidePointerEvents"
        @dismiss="open = false"
      >
        <FocusScope
          as-child
          :trapped="trapped"
        >
          <PopperContent
            class="flex items-start gap-4 bg-white min-w-[200px] min-h-[150px] p-6 rounded-md"
            :style="{
              backgroundColor: color,
            }"
            side="bottom"
            :side-offset="10"
            align="start"
          >
            <slot />

            <button @click="open = false">
              {{ closeLabel }}
            </button>
            <input
              type="text"
              value="hello world"
            >
            <PopperArrow
              :width="10"
              :height="4"
              :style="{
                fill: color,
              }"
            />
          </PopperContent>
        </FocusScope>
      </DismissableLayer>
    </Teleport>
  </PopperRoot>
</template>
