<script setup lang="ts">
import ScrollAreaCopy from './_ScrollAreaCopy.vue'
import ScrollAreaStory from './_ScrollAreaStory.vue'
</script>

<template>
  <Story
    title="Scroll Area/Chromatic/Vertical"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant
      auto-props-disabled
      title="Vertical (Auto with overflow)"
    >
      <ScrollAreaStory
        type="auto"
        vertical
        :horizontal="false"
      >
        <ScrollAreaCopy
          v-for="i in 10"
          :key="i"
        />
      </ScrollAreaStory>
    </Variant>

    <Variant
      auto-props-disabled
      title="Vertical (Auto without overflow)"
    >
      <ScrollAreaStory
        type="auto"
        vertical
        :horizontal="false"
      >
        <ScrollAreaCopy class="overflow-hidden h-[50px]" />
      </ScrollAreaStory>
    </Variant>

    <Variant
      auto-props-disabled
      title="Vertical (Always with overflow)"
    >
      <ScrollAreaStory
        type="always"
        vertical
        :horizontal="false"
      >
        <ScrollAreaCopy
          v-for="i in 10"
          :key="i"
        />
      </ScrollAreaStory>
    </Variant>

    <Variant />

    <Variant
      auto-props-disabled
      title="Vertical (Scroll with overflow)"
    >
      <ScrollAreaStory
        type="scroll"
        vertical
        :horizontal="false"
      >
        <ScrollAreaCopy
          v-for="i in 10"
          :key="i"
        />
      </ScrollAreaStory>
    </Variant>

    <Variant
      auto-props-disabled
      title="Vertical (Scroll without overflow)"
    >
      <ScrollAreaStory
        type="scroll"
        vertical
        :horizontal="false"
      >
        <ScrollAreaCopy class="overflow-hidden h-[50px]" />
      </ScrollAreaStory>
    </Variant>

    <Variant
      auto-props-disabled
      title="Vertical (Hover with overflow)"
    >
      <ScrollAreaStory
        type="hover"
        vertical
        :horizontal="false"
      >
        <ScrollAreaCopy
          v-for="i in 10"
          :key="i"
        />
      </ScrollAreaStory>
    </Variant>

    <Variant
      auto-props-disabled
      title="Vertical (Hover without overflow)"
    >
      <ScrollAreaStory
        type="hover"
        vertical
        :horizontal="false"
      >
        <ScrollAreaCopy class="overflow-hidden h-[50px]" />
      </ScrollAreaStory>
    </Variant>
  </Story>
</template>
