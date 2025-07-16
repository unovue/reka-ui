<script setup lang="ts">
import { ref } from 'vue'
import { DismissableLayer } from '..'

// eslint-disable-next-line import/no-self-import
import DismissableBox from './_DismissableBox.vue'

const open = ref(false)
const buttonRef = ref<HTMLElement>()
</script>

<template>
  <DismissableLayer
    v-bind="{ ...$attrs }"
    class="p-4 rounded-xl bg-gray-100/10"
  >
    <button
      ref="buttonRef"
      type="button"
      @click="open = !open"
    >
      {{ open ? "Close" : "Open" }} new layer
    </button>

    <DismissableBox
      v-if="open"
      @dismiss="open = false"
      @focus-outside.prevent
      @pointer-down-outside="
        (ev) => {
          if (ev.target === buttonRef) {
            ev.preventDefault();
          }
        }
      "
    />
  </DismissableLayer>
</template>
