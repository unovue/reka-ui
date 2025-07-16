<script setup lang="ts">
const props = defineProps({
  open: Boolean,
  node: HTMLElement,
})

const emits = defineEmits(['update:open'])

function handleToggleVisibility() {
  const node = props.node
  if (node) {
    if (node.style.display === 'none')
      node.style.display = 'block'
    else node.style.display = 'none'
  }
}
</script>

<template>
  <form class="grid grid-cols-2 mb-8">
    <fieldset>
      <legend>Mount</legend>
      <button
        class="px-2 py-0.5 bg-green-700 rounded"
        type="button"
        @click="emits('update:open', !open)"
      >
        toggle
      </button>
    </fieldset>

    <fieldset>
      <legend>Visibility (triggers cancel event)</legend>
      <button
        class="px-2 py-0.5 bg-green-700 rounded"
        type="button"
        @click="handleToggleVisibility"
      >
        toggle
      </button>
    </fieldset>
  </form>
</template>
