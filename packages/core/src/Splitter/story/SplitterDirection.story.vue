<script setup lang="ts">
import type { DataOrientation } from '@/shared/types'
import { ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '../'

const direction = ref<DataOrientation>('horizontal')
</script>

<template>
  <Story
    title="Splitter/Direction"
    :layout="{ type: 'single', width: '100%', iframe: false }"
  >
    <Variant title="default">
      <div class="w-full">
        <div>
          <button
            class="px-3 py-1.5 text-sm rounded bg-white hover:bg-slate-100 text-slate-800 capitalize"
            @click="direction = direction === 'horizontal' ? 'vertical' : 'horizontal'"
          >
            {{ direction }}
          </button>
        </div>
        <div class="w-full mt-4 h-48">
          <SplitterGroup :direction="direction">
            <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
              Panel A
            </SplitterPanel>
            <SplitterResizeHandle
              class="data-[state=active]:bg-white transition"
              :class="direction === 'horizontal' ? 'w-2' : 'h-2'"
            />
            <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
              Panel B
            </SplitterPanel>
          </SplitterGroup>
        </div>
      </div>
    </Variant>
  </Story>
</template>
