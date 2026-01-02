<script setup lang="ts">
import type { Component } from 'vue'
import { createApp, useTemplateRef, watch } from 'vue'
import DialogShadowRoot from './DialogShadowRoot.vue'

function mountShadowRoot(container: HTMLDivElement, component: Component) {
  const elementWithShadow = container as Element & { shadowRoot: ShadowRoot | null }
  const shadowRoot
    = elementWithShadow.shadowRoot || elementWithShadow.attachShadow({ mode: 'open' })

  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    shadowRoot.appendChild(node.cloneNode(true))
  })

  const shadowMountPoint = document.createElement('div')
  shadowRoot.appendChild(shadowMountPoint)

  const shadowPortalTarget = document.createElement('div')
  shadowPortalTarget.id = `portal-shadow-root`
  shadowRoot.appendChild(shadowPortalTarget)

  createApp(component, {
    portalTarget: shadowPortalTarget,
  }).mount(shadowMountPoint)
}

function resetShadowRoot(container: HTMLDivElement) {
  const elementWithShadow = container as Element & { shadowRoot: ShadowRoot | null }
  if (elementWithShadow.shadowRoot) {
    elementWithShadow.shadowRoot.innerHTML = ''
  }
}

const container = useTemplateRef('container')

watch(
  container,
  (newVal) => {
    if (newVal) {
      resetShadowRoot(newVal)
      mountShadowRoot(newVal, DialogShadowRoot)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    id="shadow-root-container"
    ref="container"
  />
</template>
