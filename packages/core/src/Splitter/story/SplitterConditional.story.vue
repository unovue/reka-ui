<script setup lang="ts">
import { ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'

const isShowingA = ref(false)
const isShowingB = ref(false)
</script>

<template>
  <Story
    title="Splitter/Conditional"
    :layout="{ type: 'single', width: '100%', iframe: false }"
  >
    <Variant title="default">
      <div class="w-full">
        <div>
          <button
            class="px-3 py-1.5 text-sm rounded bg-white hover:bg-slate-100 text-slate-800"
            @click="isShowingA = !isShowingA"
          >
            {{ isShowingA ? 'Hide' : 'Show' }} A
          </button>
          <button
            class="ml-2 px-3 py-1.5 text-sm rounded bg-white hover:bg-slate-100 text-slate-800"
            @click="isShowingB = !isShowingB"
          >
            {{ isShowingB ? 'Hide' : 'Show' }} B
          </button>
        </div>

        <div class="w-full mt-4 h-48">
          <SplitterGroup direction="horizontal">
            <template v-if="isShowingA">
              <SplitterPanel
                :min-size="20"
                class="flex items-center justify-center bg-blackA8 rounded-lg"
                :order="1"
              >
                Panel A
              </SplitterPanel>
              <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
            </template>

            <template v-if="isShowingB">
              <SplitterPanel
                :min-size="20"
                class="flex items-center justify-center bg-blackA8 rounded-lg"
                :order="2"
              >
                Panel B
              </SplitterPanel>
              <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
            </template>

            <SplitterPanel
              :min-size="20"
              class="flex items-center justify-center bg-blackA8 rounded-lg"
              :order="3"
            >
              Panel C
            </SplitterPanel>
          </SplitterGroup>
        </div>
      </div>
    </Variant>
  </Story>
</template>
