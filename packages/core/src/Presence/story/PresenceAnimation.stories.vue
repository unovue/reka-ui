<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { ref, watchEffect } from 'vue'
import { Presence } from '..'
import Animation from './_Animation.vue'
import Toggle from './_Toggle.vue'

const node = ref<HTMLElement>()
const timerRef = ref(0)
const open = ref(false)
const animate = ref(false)

watchEffect(() => {
  if (open.value) {
    timerRef.value = window.setTimeout(() => (animate.value = true), 150)
  }
  else {
    animate.value = false
    window.clearTimeout(timerRef.value)
  }
})

const { Story } = defineMeta({
  title: 'Presence/Animation',
  group: 'utilities',
})
</script>

<template>
  <Story
    name="With Mount Animation"
    as-child
  >
    <Animation class="animate-fadeIn" />
  </Story>

  <Story
    name="With Unmount Animation"
    as-child
  >
    <Animation class="data-[state=closed]:animate-fadeOut" />
  </Story>

  <Story
    name="With Multiple Animation"
    as-child
  >
    <Animation class="multipleMountAnimationsClass" />
  </Story>

  <Story
    name="With Open & Close Animation"
    as-child
  >
    <Animation
      class="data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut"
    />
  </Story>

  <Story
    name="With Multiple Open & Close Animation"
    as-child
  >
    <Animation class="multipleOpenAndCloseAnimationsClass" />
  </Story>

  <Story
    name="With Deferred Mount Animation"
    as-child
  >
    <div>
      <p class="text-xs mb-4">
        Deferred animation should unmount correctly when toggled. Content will
        flash briefly while we wait for animation to be applied.
      </p>
      <Toggle
        v-model:open="open"
        :node="node"
      />
      <Presence :present="open">
        <div
          ref="node"
          :class="animate ? 'animate-fadeIn' : undefined"
        >
          Content
        </div>
      </Presence>
    </div>
  </Story>
</template>
