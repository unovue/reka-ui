<script setup lang="ts">
import { ref } from 'vue'
import { Presence } from '..'

const isOpen = ref(false)
</script>

<template>
  <Story
    group="utilities"
    title="Presence/Transition"
    :layout="{ type: 'grid', width: '33%' }"
    auto-props-disabled
  >
    <Variant title="With Vue Transition">
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
    </Variant>
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
