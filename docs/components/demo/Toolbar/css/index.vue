<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  ToolbarButton,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const toggleStateSingle = ref('center')
const toggleStateMultiple = ref([])
</script>

<template>
  <ToolbarRoot
    class="ToolbarRoot"
    aria-label="Formatting options"
  >
    <ToolbarToggleGroup
      v-model="toggleStateMultiple"
      type="multiple"
      aria-label="Text formatting"
    >
      <ToolbarToggleItem
        class="ToolbarToggleItem"
        value="bold"
        aria-label="Bold"
      >
        <Icon icon="radix-icons:font-bold" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="ToolbarToggleItem"
        value="italic"
        aria-label="Italic"
      >
        <Icon icon="radix-icons:font-italic" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="ToolbarToggleItem"
        value="strikethrough"
        aria-label="Strike through"
      >
        <Icon icon="radix-icons:strikethrough" />
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
    <ToolbarSeparator class="ToolbarSeparator" />
    <ToolbarToggleGroup
      v-model="toggleStateSingle"
      type="single"
      aria-label="Text Alignment"
    >
      <ToolbarToggleItem
        class="ToolbarToggleItem"
        value="left"
        aria-label="Left Aligned"
      >
        <Icon icon="radix-icons:text-align-left" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="ToolbarToggleItem"
        value="center"
        aria-label="Center Aligned"
      >
        <Icon icon="radix-icons:text-align-center" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="ToolbarToggleItem"
        value="right"
        aria-label="Right Aligned"
      >
        <Icon icon="radix-icons:text-align-right" />
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
    <ToolbarSeparator class="ToolbarSeparator" />
    <ToolbarLink
      class="ToolbarLink"
      href="#"
      target="_blank"
      style="margin-right: 10"
    >
      Edited 2 hours ago
    </ToolbarLink>
    <ToolbarButton
      class="ToolbarButton"
      style="margin-left: auto"
    >
      Share
    </ToolbarButton>
  </ToolbarRoot>
</template>
