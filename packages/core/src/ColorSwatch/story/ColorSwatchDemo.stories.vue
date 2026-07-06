<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { ColorSwatch } from '..'

const swatchClass = 'w-8 h-8 rounded ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)]'

const { Story } = defineMeta({
  title: 'ColorSwatch/Demo',
})
</script>

<template>
  <Story
    name="Default"
    as-child
  >
    <ColorSwatch
      color="#E5484D"
      :class="swatchClass"
    />
  </Story>

  <Story
    name="Various Colors"
    as-child
  >
    <div class="flex gap-2">
      <ColorSwatch
        v-for="color in ['#E5484D', '#D6409F', '#8E4EC6', '#0090FF', '#30A46C', '#F76B15', '#FFE629']"
        :key="color"
        :color="color"
        :class="swatchClass"
      />
    </div>
  </Story>

  <Story
    name="Transparent / No Color"
    as-child
  >
    <div class="flex gap-2 items-center">
      <ColorSwatch
        color="#ff000000"
        :class="swatchClass"
      />
      <ColorSwatch
        color=""
        :class="swatchClass"
      />
    </div>
  </Story>

  <Story
    name="With Alpha"
    as-child
  >
    <div class="flex gap-2">
      <ColorSwatch
        v-for="alpha in ['ff', 'cc', '80', '33']"
        :key="alpha"
        :color="`#E5484D${alpha}`"
        :class="swatchClass"
      />
    </div>
  </Story>

  <Story
    name="Custom Label"
    as-child
  >
    <ColorSwatch
      color="#E5484D"
      label="Brand Red"
      :class="swatchClass"
    />
  </Story>

  <Story
    name="Color Object (HSL)"
    as-child
  >
    <ColorSwatch
      :color="{ space: 'hsl', h: 220, s: 90, l: 56, alpha: 1 }"
      :class="swatchClass"
    />
  </Story>

  <Story
    name="Various Sizes"
    as-child
  >
    <div class="flex gap-2 items-center">
      <ColorSwatch
        color="#0090FF"
        class="w-4 h-4 rounded-sm ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)]"
      />
      <ColorSwatch
        color="#0090FF"
        :class="swatchClass"
      />
      <ColorSwatch
        color="#0090FF"
        class="w-12 h-12 rounded-lg ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)]"
      />
    </div>
  </Story>
</template>
