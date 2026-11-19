<script setup lang="ts">
import { ColorSwatch } from '..'

const swatchClass = 'w-8 h-8 rounded ring-1 ring-inset ring-black/15 dark:ring-white/15 bg-[var(--reka-color-swatch-color)]'
</script>

<template>
  <Story
    title="ColorSwatch/Demo"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Default">
      <ColorSwatch
        color="#E5484D"
        :class="swatchClass"
      />
    </Variant>

    <Variant title="Various Colors">
      <div class="flex gap-2">
        <ColorSwatch
          v-for="color in ['#E5484D', '#D6409F', '#8E4EC6', '#0090FF', '#30A46C', '#F76B15', '#FFE629']"
          :key="color"
          :color="color"
          :class="swatchClass"
        />
      </div>
    </Variant>

    <Variant title="Transparent / No Color">
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
    </Variant>

    <Variant title="With Alpha">
      <div class="flex gap-2">
        <ColorSwatch
          v-for="alpha in ['ff', 'cc', '80', '33']"
          :key="alpha"
          :color="`#E5484D${alpha}`"
          :class="swatchClass"
        />
      </div>
    </Variant>

    <Variant title="Custom Label">
      <ColorSwatch
        color="#E5484D"
        label="Brand Red"
        :class="swatchClass"
      />
    </Variant>

    <Variant title="Color Object (HSL)">
      <ColorSwatch
        :color="{ space: 'hsl', h: 220, s: 90, l: 56, alpha: 1 }"
        :class="swatchClass"
      />
    </Variant>

    <Variant title="Various Sizes">
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
    </Variant>
  </Story>
</template>
