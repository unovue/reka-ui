<script setup lang="ts">
import { ref } from 'vue'
import Button from './_Button.vue'
import ButtonGroup from './_ButtonGroup.vue'

const dir = ref<'ltr' | 'rtl'>('ltr')
</script>

<template>
  <Story
    group="utilities"
    title="Roving Focus/Basic"
    :layout="{ type: 'grid', width: '50%' }"
    auto-props-disabled
  >
    <Variant title="No orientation (both) + no looping">
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
    </Variant>

    <Variant title="No orientation (both) +  looping">
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
    </Variant>

    <Variant title="Horizontal orientation + no looping">
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
    </Variant>

    <Variant title="Horizontal orientation + looping">
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
    </Variant>

    <Variant title="Vertical orientation + no looping">
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
    </Variant>

    <Variant title="Vertical orientation + looping">
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
    </Variant>
  </Story>
</template>
