<script setup vapor lang="ts">
import { AspectRatio, AvatarFallback, AvatarImage, AvatarRoot, ProgressIndicator, ProgressRoot, Separator } from '#reka'
import { ref } from 'vue'

const progress = ref<number | null>(30)
defineExpose({ progress })
</script>

<template>
  <ProgressRoot
    id="progress"
    v-model="progress"
    aria-label="Upload"
  >
    <ProgressIndicator
      id="progress-indicator"
      :style="{ width: `${progress ?? 0}%` }"
    />
  </ProgressRoot>
  <button
    id="progress-more"
    @click="progress = (progress ?? 0) + 20"
  >
    more
  </button>
  <button
    id="progress-unknown"
    @click="progress = null"
  >
    unknown
  </button>

  <AvatarRoot id="avatar">
    <AvatarImage
      id="avatar-img"
      src="data:image/png;base64,broken"
      alt="Colm"
    />
    <AvatarFallback id="avatar-fallback">
      CT
    </AvatarFallback>
  </AvatarRoot>

  <div style="width: 200px">
    <AspectRatio
      id="ratio"
      :ratio="2"
    >
      <div
        id="ratio-child"
        style="height: 100%"
      >
        2:1
      </div>
    </AspectRatio>
  </div>

  <Separator
    id="sep"
    orientation="vertical"
  />
  <Separator
    id="sep-deco"
    decorative
  />

  <!-- asChild, both forms -->
  <ProgressRoot
    as-child
    :model-value="50"
  >
    <div
      id="progress-adopted"
      aria-label="Adopted"
      data-state="mine"
    />
  </ProgressRoot>
  <Separator
    v-slot="{ props }"
    as-child
  >
    <hr
      v-bind="props"
      id="sep-slotted"
    >
  </Separator>
</template>
