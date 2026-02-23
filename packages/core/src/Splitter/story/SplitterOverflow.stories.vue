<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'

const { Story } = defineMeta({
  title: 'Splitter/Overflow',
})
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <div class="w-full h-48">
      <SplitterGroup direction="horizontal">
        <SplitterPanel class="bg-blackA8 rounded-lg ">
          <div class="h-full overflow-auto">
            <div class="h-96 w-[30vw] p-4">
              Panel A
            </div>
          </div>
        </SplitterPanel>
        <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
        <SplitterPanel class="bg-blackA8 rounded-lg ">
          <div class="h-full overflow-auto">
            <div class="h-96 w-[30vw] p-4">
              Panel B
            </div>
          </div>
        </SplitterPanel>
      </SplitterGroup>
    </div>
  </Story>
</template>
