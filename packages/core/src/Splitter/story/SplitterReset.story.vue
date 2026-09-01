<script setup lang="ts">
import { ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'

const splitterMain = ref<InstanceType<typeof SplitterGroup>>()
const splitterNested = ref<InstanceType<typeof SplitterGroup>>()
</script>

<template>
  <Story
    title="Splitter/Reset"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div class="flex mx-2 gap-2 mb-3 justify-center">
        <button
          class=" border p-3 flex items-center justify-center rounded bg-card hover:bg-muted disabled:opacity-50"
          @click="() => splitterMain?.resetGroup()"
        >
          Reset main Splitter
        </button>
        <button
          class=" border p-3 flex items-center justify-center rounded bg-card hover:bg-muted disabled:opacity-50"

          @click="() => splitterNested?.resetGroup()"
        >
          Reset nested Splitter
        </button>
      </div>

      <div class="w-full h-48">
        <SplitterGroup
          ref="splitterMain"
          direction="horizontal"
        >
          <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
            Panel A
          </SplitterPanel>
          <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
          <SplitterPanel class="flex items-center justify-center rounded-lg">
            <SplitterGroup
              ref="splitterNested"
              direction="vertical"
            >
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
    </Variant>
  </Story>
</template>
