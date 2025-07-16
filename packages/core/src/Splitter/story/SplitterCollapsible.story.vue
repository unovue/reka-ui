<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'
</script>

<template>
  <Story
    title="Splitter/Collapsible"
    :layout="{ type: 'single', width: '100%', iframe: false }"
  >
    <Variant title="default">
      <div class="w-full h-48">
        <SplitterGroup direction="horizontal">
          <SplitterPanel
            collapsible
            :collapsed-size="5"
            :default-size="20"
            :max-size="30"
            :min-size="15"
            class="bg-blackA8 rounded-lg"
          >
            <div class="p-4">
              Panel A
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
    </Variant>
  </Story>
</template>
