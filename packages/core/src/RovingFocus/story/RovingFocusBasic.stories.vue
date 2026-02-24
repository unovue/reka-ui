<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import { ref } from 'vue'
import Button from './_Button.vue'
import ButtonGroup from './_ButtonGroup.vue'

const dir = ref<'ltr' | 'rtl'>('ltr')

const { Story } = defineMeta({
  title: 'Roving Focus/Basic',
  group: 'utilities',
})
</script>

<template>
  <Story
    name="No orientation (both) + no looping"
    :as-child="true"
  >
    <ButtonGroup
      :dir="dir"
      default-value="two"
    >
      <Button value="one">
        One
      </Button>
      <Button value="two">
        Two
      </Button>
      <Button
        disabled
        value="three"
      >
        Three
      </Button>
      <Button value="four">
        Four
      </Button>
    </ButtonGroup>
  </Story>

  <Story
    name="No orientation (both) +  looping"
    :as-child="true"
  >
    <ButtonGroup
      :dir="dir"
      default-value="two"
      loop
    >
      <Button value="one">
        One
      </Button>
      <Button value="two">
        Two
      </Button>
      <Button
        disabled
        value="three"
      >
        Three
      </Button>
      <Button value="four">
        Four
      </Button>
    </ButtonGroup>
  </Story>

  <Story
    name="Horizontal orientation + no looping"
    :as-child="true"
  >
    <ButtonGroup
      :dir="dir"
      orientation="horizontal"
    >
      <Button value="one">
        One
      </Button>
      <Button value="two">
        Two
      </Button>
      <Button
        disabled
        value="three"
      >
        Three
      </Button>
      <Button value="four">
        Four
      </Button>
    </ButtonGroup>
  </Story>

  <Story
    name="Horizontal orientation + looping"
    :as-child="true"
  >
    <ButtonGroup
      :dir="dir"
      orientation="horizontal"
      loop
    >
      <Button value="one">
        One
      </Button>
      <Button value="two">
        Two
      </Button>
      <Button
        disabled
        value="three"
      >
        Three
      </Button>
      <Button value="four">
        Four
      </Button>
    </ButtonGroup>
  </Story>

  <Story
    name="Vertical orientation + no looping"
    :as-child="true"
  >
    <ButtonGroup
      :dir="dir"
      orientation="vertical"
    >
      <Button value="one">
        One
      </Button>
      <Button value="two">
        Two
      </Button>
      <Button
        disabled
        value="three"
      >
        Three
      </Button>
      <Button value="four">
        Four
      </Button>
    </ButtonGroup>
  </Story>

  <Story
    name="Vertical orientation + looping"
    :as-child="true"
  >
    <ButtonGroup
      :dir="dir"
      orientation="vertical"
      loop
    >
      <Button value="one">
        One
      </Button>
      <Button value="two">
        Two
      </Button>
      <Button
        disabled
        value="three"
      >
        Three
      </Button>
      <Button value="four">
        Four
      </Button>
    </ButtonGroup>
  </Story>
</template>
