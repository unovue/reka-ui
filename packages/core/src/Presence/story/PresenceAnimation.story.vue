<script setup lang="ts">
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
</script>

<template>
  <Story
    group="utilities"
    title="Presence/Animation"
    :layout="{ type: 'grid', width: '33%' }"
    auto-props-disabled
  >
    <Variant title="With Mount Animation">
      <Animation class="animate-fadeIn" />
    </Variant>

    <Variant title="With Unmount Animation">
      <Animation class="data-[state=closed]:animate-fadeOut" />
    </Variant>

    <Variant title="With Multiple Animation">
      <Animation class="multipleMountAnimationsClass" />
    </Variant>

    <Variant title="With Open & Close Animation">
      <Animation
        class="data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut"
      />
    </Variant>

    <Variant title="With Multiple Open & Close Animation">
      <Animation class="multipleOpenAndCloseAnimationsClass" />
    </Variant>

    <Variant title="With Deferred Mount Animation">
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
    </Variant>
  </Story>
</template>

<style>
@keyframes slideUp2 {
  from {
    transform: translateY(30px);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes slideDown2 {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(30px);
  }
}

.multipleMountAnimationsClass {
  animation: fadeIn 6s cubic-bezier(0.22, 1, 0.36, 1),
    slideUp2 6s cubic-bezier(0.22, 1, 0.36, 1);
}

.multipleOpenAndCloseAnimationsClass[data-state="open"] {
  animation: fadeIn 3s cubic-bezier(0.22, 1, 0.36, 1),
    slideUp2 3s cubic-bezier(0.22, 1, 0.36, 1);
}
.multipleOpenAndCloseAnimationsClass[data-state="closed"] {
  animation: fadeOut 3s cubic-bezier(0.22, 1, 0.36, 1),
    slideDown2 3s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
