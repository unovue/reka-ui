<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'

const { Story } = defineMeta({
  title: 'Splitter/Demo',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <div class="w-full h-48">
      <SplitterGroup direction="horizontal">
        <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
          Panel A
        </SplitterPanel>
        <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
        <SplitterPanel class="flex items-center justify-center rounded-lg">
          <SplitterGroup direction="vertical">
            <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
              Panel B1
            </SplitterPanel>
            <SplitterResizeHandle class="h-2 data-[state=active]:bg-white transition" />
            <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
              Panel B2
            </SplitterPanel>
          </SplitterGroup>
        </SplitterPanel>
        <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
        <SplitterPanel
          :max-size="20"
          class="flex items-center justify-center bg-blackA8 rounded-lg"
        >
          Panel C
        </SplitterPanel>
      </SplitterGroup>
    </div>
  </Story>
</template>
