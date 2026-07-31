<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

const props = withDefaults(
  defineProps<{
    mode?: 'open' | 'closed'
  }>(),
  {
    mode: 'open',
  },
)

const hostRef = useTemplateRef('host')
const mountPoint = ref<HTMLElement>()

onMounted(() => {
  const host = hostRef.value
  if (!host)
    return
  const shadowRoot = host.attachShadow({ mode: props.mode })
  // Clone the page's current stylesheets into the shadow root so content
  // teleported into it still picks up Histoire/Tailwind styling — a real
  // shadow-rooted MFE would ship its own styles the same way.
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    shadowRoot.appendChild(node.cloneNode(true))
  })
  const point = document.createElement('div')
  shadowRoot.appendChild(point)
  mountPoint.value = point
})
</script>

<template>
  <div
    ref="host"
    data-testid="shadow-root-host"
    class="border-2 border-dashed border-orange-500 p-4"
  />
  <Teleport
    v-if="mountPoint"
    :to="mountPoint"
  >
    <slot :mount-point="mountPoint" />
  </Teleport>
</template>
