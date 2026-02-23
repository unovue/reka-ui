<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { ref } from 'vue'
import { Presence } from '..'

const open = ref(false)

const { Story } = defineMeta({
  title: 'Presence/Basic',
  group: 'utilities',
})
</script>

<template>
  <Story
    name="Basic"
    as-child
  >
    <div>
      <div>
        <button @click="open = !open">
          toggle
        </button>
      </div>
      <Presence :present="open">
        <div>Content</div>
      </Presence>
    </div>
  </Story>
</template>
