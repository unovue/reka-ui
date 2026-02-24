<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { ref } from 'vue'
import { Presence } from '..'

const isOpen = ref(false)

const { Story } = defineMeta({
  title: 'Presence/Transition',
  group: 'utilities',
})
</script>

<template>
  <Story
    name="With Vue Transition"
    :as-child="true"
  >
    <div>
      <button @click="isOpen = !isOpen">
        Toggle content
      </button>

      <Transition>
        <Presence
          :present="isOpen"
          force-mount
        >
          <div>Content</div>
        </Presence>
      </Transition>
    </div>
  </Story>
</template>
