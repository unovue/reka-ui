<script setup lang="ts">
import { ref } from 'vue'
import { ColorSwatchPickerItem, ColorSwatchPickerItemIndicator, ColorSwatchPickerItemSwatch, ColorSwatchPickerRoot } from '..'

const colors = [
  '#E5484D',
  '#D6409F',
  '#8E4EC6',
  '#0090FF',
  '#30A46C',
  '#F76B15',
  '#FFE629',
]

const selectedColor = ref('#0090FF')
const selectedMultiple = ref(['#E5484D', '#30A46C'])
</script>

<template>
  <Story
    title="ColorSwatchPicker/Demo"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Default">
      <ColorSwatchPickerRoot
        aria-label="Pick a color"
        class="flex gap-2"
      >
        <ColorSwatchPickerItem
          v-for="color in colors"
          :key="color"
          :value="color"
          class="relative"
        >
          <ColorSwatchPickerItemSwatch
            class="w-8 h-8 rounded cursor-pointer ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)] peer"
          />
          <ColorSwatchPickerItemIndicator class="absolute bottom-1 right-1 size-1 rounded-full bg-white peer-data-[color-contrast=dark]:bg-black" />
        </ColorSwatchPickerItem>
      </ColorSwatchPickerRoot>
    </Variant>

    <Variant title="Controlled">
      <div class="flex flex-col gap-3">
        <ColorSwatchPickerRoot
          v-model="selectedColor"
          aria-label="Pick a color"
          class="flex gap-2"
        >
          <ColorSwatchPickerItem
            v-for="color in colors"
            :key="color"
            :value="color"
            class="relative"
          >
            <ColorSwatchPickerItemSwatch
              class="w-8 h-8 rounded cursor-pointer ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)] peer"
            />
            <ColorSwatchPickerItemIndicator class="absolute bottom-1 right-1 size-1 rounded-full bg-white peer-data-[color-contrast=dark]:bg-black" />
          </ColorSwatchPickerItem>
        </ColorSwatchPickerRoot>
        <p class="text-sm text-gray-600">
          Selected: {{ selectedColor }}
        </p>
      </div>
    </Variant>

    <Variant title="Multiple Selection">
      <div class="flex flex-col gap-3">
        <ColorSwatchPickerRoot
          v-model="selectedMultiple"
          multiple
          aria-label="Pick colors"
          class="flex gap-2"
        >
          <ColorSwatchPickerItem
            v-for="color in colors"
            :key="color"
            :value="color"
            class="relative"
          >
            <ColorSwatchPickerItemSwatch
              class="w-8 h-8 rounded cursor-pointer ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)] peer"
            />
            <ColorSwatchPickerItemIndicator class="absolute bottom-1 right-1 size-1 rounded-full bg-white peer-data-[color-contrast=dark]:bg-black" />
          </ColorSwatchPickerItem>
        </ColorSwatchPickerRoot>
        <p class="text-sm text-gray-600">
          Selected: {{ selectedMultiple.join(', ') }}
        </p>
      </div>
    </Variant>

    <Variant title="With Default Value">
      <ColorSwatchPickerRoot
        default-value="#8E4EC6"
        aria-label="Pick a color"
        class="flex gap-2"
      >
        <ColorSwatchPickerItem
          v-for="color in colors"
          :key="color"
          :value="color"
          class="relative"
        >
          <ColorSwatchPickerItemSwatch
            class="w-8 h-8 rounded cursor-pointer ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)] peer"
          />
          <ColorSwatchPickerItemIndicator class="absolute bottom-1 right-1 size-1 rounded-full bg-white peer-data-[color-contrast=dark]:bg-black" />
        </ColorSwatchPickerItem>
      </ColorSwatchPickerRoot>
    </Variant>

    <Variant title="Disabled">
      <ColorSwatchPickerRoot
        disabled
        aria-label="Pick a color"
        class="flex gap-2 opacity-50"
      >
        <ColorSwatchPickerItem
          v-for="color in colors"
          :key="color"
          :value="color"
          class="relative"
        >
          <ColorSwatchPickerItemSwatch
            class="w-8 h-8 rounded ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)] peer"
          />
          <ColorSwatchPickerItemIndicator class="absolute bottom-1 right-1 size-1 rounded-full bg-white peer-data-[color-contrast=dark]:bg-black" />
        </ColorSwatchPickerItem>
      </ColorSwatchPickerRoot>
    </Variant>
  </Story>
</template>
