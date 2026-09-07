<script setup lang="ts">
import type { Component } from 'vue'
import { createApp, useTemplateRef, watch } from 'vue'

import _Dialog from './_Dialog.vue'

const options = [
  { name: 'Fruit', children: [
    { name: 'Apple' },
    { name: 'Banana' },
    { name: 'Orange' },
    { name: 'Honeydew' },
    { name: 'Grapes' },
    { name: 'Watermelon' },
    { name: 'Cantaloupe' },
    { name: 'Pear' },
  ] },
  { name: 'Vegetable', children: [
    { name: 'Cabbage' },
    { name: 'Broccoli' },
    { name: 'Carrots' },
    { name: 'Lettuce' },
    { name: 'Spinach' },
    { name: 'Bok Choy' },
    { name: 'Cauliflower' },
    { name: 'Potatoes' },
  ] },
]

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
    dialogPortalTarget: shadowPortalTarget,
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
      mountShadowRoot(newVal, _Dialog)
    }
  },
  { immediate: true },
)
</script>

<template>
  <Story
    title="Combobox/ShadowRoot"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div
        id="shadow-root-container"
        ref="container"
        class="h-96"
      />
    </Variant>
  </Story>
</template>
