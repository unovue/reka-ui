<script setup vapor lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, ScrollAreaVirtualizer, SplitterGroup, SplitterPanel, SplitterResizeHandle } from '#reka'
import { ref } from 'vue'

const sizes = ref<number[]>([])
const rows = Array.from({ length: 50 }, (_, i) => `Row ${i}`)
const many = Array.from({ length: 1000 }, (_, i) => `Item ${i}`)
</script>

<template>
  <ScrollAreaRoot
    id="scroll"
    type="always"
    style="width: 200px; height: 120px"
  >
    <ScrollAreaViewport
      id="viewport"
      style="width: 100%; height: 100%"
    >
      <div
        v-for="r in rows"
        :key="r"
        style="height: 20px"
      >
        {{ r }}
      </div>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      id="scrollbar"
      orientation="vertical"
      style="width: 8px"
    >
      <ScrollAreaThumb
        id="thumb"
        style="background: #333"
      />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>

  <div style="width: 400px; height: 100px">
    <SplitterGroup
      id="splitter"
      direction="horizontal"
      @layout="(l: number[]) => sizes = l"
    >
      <SplitterPanel
        id="panel-a"
        :default-size="50"
        :min-size="20"
      >
        A
      </SplitterPanel>
      <!-- asChild, template form -->
      <SplitterResizeHandle as-child>
        <div
          id="handle"
          data-state="mine"
          aria-label="Resize"
          style="width: 6px; background: #999"
        />
      </SplitterResizeHandle>
      <SplitterPanel
        id="panel-b"
        :default-size="50"
      >
        B
      </SplitterPanel>
    </SplitterGroup>
  </div>
  <span id="sizes">{{ sizes.map(Math.round).join() }}</span>

  <!-- asChild, v-slot form -->
  <ScrollAreaRoot
    v-slot="{ props }"
    as-child
    style="width: 100px; height: 40px"
  >
    <section
      v-bind="props"
      id="scroll-slotted"
      aria-label="Notes"
    >
      <ScrollAreaViewport style="width: 100%; height: 100%">
        <p style="height: 200px">
          Notes
        </p>
      </ScrollAreaViewport>
    </section>
  </ScrollAreaRoot>

  <ScrollAreaRoot
    id="vscroll"
    style="width: 200px; height: 120px"
  >
    <ScrollAreaViewport
      id="vviewport"
      style="width: 100%; height: 100%"
    >
      <ScrollAreaVirtualizer
        v-slot="{ option }"
        :options="many"
        :estimate-size="20"
      >
        <div
          class="vrow"
          style="height: 20px"
        >
          {{ option }}
        </div>
      </ScrollAreaVirtualizer>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
