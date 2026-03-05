<script setup lang="ts">
import Dialog from './shadowDom/_Dialog.vue'
import ShadowRootContainer from './shadowDom/ShadowRootContainer.vue'
</script>

<template>
  <Story
    group="utilities"
    title="FocusScope/ShadowRoot"
    :layout="{ type: 'single' }"
  >
    <div class="text-center flex-col gap-8 flex p-2">
      <div>
        <span>Dialog in body and focusable elements in shadow root</span>
        <Dialog :has-shadow-root-inside="true" />
      </div>
      <div>
        <span>Dialog and focusable elements in shadow root</span>
        <ShadowRootContainer with-dialog />
      </div>
      <div>
        <span>Dialog and focusable elements in body</span>
        <Dialog />
      </div>
    </div>
  </Story>
</template>
