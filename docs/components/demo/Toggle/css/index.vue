<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Toggle } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const toggleState = ref(false)
</script>

<template>
  <Toggle
    v-model="toggleState"
    aria-label="Toggle italic"
    class="Toggle"
  >
    <Icon icon="radix-icons:font-italic" />
  </Toggle>
</template>
