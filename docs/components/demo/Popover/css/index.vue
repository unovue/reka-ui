<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import './styles.css'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger
      class="IconButton"
      aria-label="Update dimensions"
    >
      <Icon icon="radix-icons:mixer-horizontal" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        side="bottom"
        :side-offset="5"
        class="PopoverContent"
      >
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 10 }">
          <p class="Text">
            Dimensions
          </p>
          <fieldset class="Fieldset">
            <label
              class="Label"
              for="width"
            > Width </label>
            <input
              id="width"
              class="Input"
              defaultValue="100%"
            >
          </fieldset>
          <fieldset class="Fieldset">
            <label
              class="Label"
              for="maxWidth"
            > Max. width </label>
            <input
              id="maxWidth"
              class="Input"
              defaultValue="300px"
            >
          </fieldset>
          <fieldset class="Fieldset">
            <label
              class="Label"
              for="height"
            > Height </label>
            <input
              id="height"
              class="Input"
              defaultValue="25px"
            >
          </fieldset>
          <fieldset class="Fieldset">
            <label
              class="Label"
              for="maxHeight"
            > Max. height </label>
            <input
              id="maxHeight"
              class="Input"
              defaultValue="none"
            >
          </fieldset>
        </div>
        <PopoverClose
          class="PopoverClose"
          aria-label="Close"
        >
          <Icon icon="radix-icons:cross-2" />
        </PopoverClose>
        <PopoverArrow class="PopoverArrow" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
