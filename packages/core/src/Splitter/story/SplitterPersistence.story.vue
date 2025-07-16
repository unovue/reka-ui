<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'
</script>

<template>
  <Story
    title="Splitter/Persistence"
    :layout="{ type: 'single', width: '100%', iframe: false }"
  >
    <Variant title="default">
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
    </Variant>
  </Story>
</template>
