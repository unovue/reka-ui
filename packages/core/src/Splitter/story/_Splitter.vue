<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'
</script>

<template>
  <div class="w-full h-48">
    <SplitterGroup direction="horizontal">
      <SplitterPanel>
        Panel A
      </SplitterPanel>
      <SplitterResizeHandle />
      <SplitterPanel>
        <SplitterGroup direction="vertical">
          <SplitterPanel>
            Panel B1
          </SplitterPanel>
          <SplitterResizeHandle />
          <SplitterPanel>
            Panel B2
          </SplitterPanel>
        </SplitterGroup>
      </SplitterPanel>
      <SplitterResizeHandle />
      <SplitterPanel :max-size="20">
        Panel C
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>
