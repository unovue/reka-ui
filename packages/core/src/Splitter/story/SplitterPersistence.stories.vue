<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'

const { Story } = defineMeta({
  title: 'Splitter/Persistence',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <div class="w-full h-48">
      <SplitterGroup
        auto-save-id="persistence"
        direction="horizontal"
      >
        <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
          Panel A
        </SplitterPanel>
        <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
        <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
          Panel B
        </SplitterPanel>
        <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
        <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
          Panel C
        </SplitterPanel>
      </SplitterGroup>
    </div>
  </Story>
</template>
