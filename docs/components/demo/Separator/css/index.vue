<script setup lang="ts">
import { Separator } from 'reka-ui'
import './styles.css'
</script>

<template>
  <div :style="{ width: '100%', maxWidth: 300, margin: '0 15px' }">
    <div class="Text">
      Reka UI
    </div>
    <div
      class="Text"
      :style="{ fontWeight: 500 }"
    >
      An open-source UI component library.
    </div>
    <Separator
      class="SeparatorRoot"
    />
    <div class="flex h-5 items-center">
      <div class="Text">
        Blog
      </div>
      <Separator
        class="SeparatorRoot"
        decorative
        orientation="vertical"
      />
      <div class="Text">
        Docs
      </div>
      <Separator
        class="SeparatorRoot"
        decorative
        orientation="vertical"
      />
      <div class="Text">
        Source
      </div>
    </div>
  </div>
</template>
