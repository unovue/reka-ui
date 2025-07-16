<script setup lang="ts">
import { ref } from 'vue'
import { Presence } from '..'

const open = ref(false)
</script>

<template>
  <Story
    group="utilities"
    title="Presence/Basic"
    :layout="{ type: 'grid', width: '33%' }"
    auto-props-disabled
  >
    <Variant title="Basic">
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
    </Variant>
  </Story>
</template>
