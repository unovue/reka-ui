<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import { Presence } from '..'

const isOpen = ref(false)

const { Story } = defineMeta({
  title: 'Presence/Transition',
})
</script>

<template>
  <Story
    name="With Vue Transition"
    as-child
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

<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
