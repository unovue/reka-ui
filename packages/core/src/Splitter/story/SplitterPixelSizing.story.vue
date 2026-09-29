<script setup lang="ts">
import { ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'

const isShowingExtra = ref(true)
const collapsibleOpen = ref(true)
const collapsiblePanelRef = ref<InstanceType<typeof SplitterPanel> | null>(null)

function handleCollapsed() {
  collapsibleOpen.value = false
}

function handleExpanded() {
  collapsibleOpen.value = true
}

function toggleCollapsible() {
  if (collapsibleOpen.value)
    collapsiblePanelRef.value?.collapse?.()
  else
    collapsiblePanelRef.value?.expand?.()

  collapsibleOpen.value = !collapsibleOpen.value
}
</script>

<template>
  <Story
    title="Splitter/Pixel sized panels"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Fixed sidebar">
      <div class="space-y-4">
        <div
          class="h-48 w-full"
        >
          <SplitterGroup direction="horizontal">
            <SplitterPanel
              size-unit="px"
              :default-size="220"
              :min-size="160"
              :max-size="320"
              class="flex items-center justify-center bg-blackA8 rounded-lg"
            >
              Sidebar (px)
            </SplitterPanel>
            <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
            <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
              Flexible content
            </SplitterPanel>
          </SplitterGroup>
        </div>
      </div>
    </Variant>

    <Variant title="Persistence (px)">
      <div class="space-y-4">
        <div
          class="h-48 w-full"
        >
          <SplitterGroup
            auto-save-id="pixel-persistence"
            direction="horizontal"
          >
            <SplitterPanel
              size-unit="px"
              :default-size="200"
              :min-size="140"
              :max-size="320"
              class="flex items-center justify-center bg-blackA8 rounded-lg"
            >
              Sidebar (px)
            </SplitterPanel>
            <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
            <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
              Resizable content
            </SplitterPanel>
          </SplitterGroup>
        </div>
      </div>
    </Variant>

    <Variant title="Conditional panel (px)">
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 text-sm rounded bg-white hover:bg-slate-100 text-slate-800"
            @click="isShowingExtra = !isShowingExtra"
          >
            {{ isShowingExtra ? 'Hide' : 'Show' }} extra panel
          </button>
        </div>

        <div class="h-48 w-full">
          <SplitterGroup direction="horizontal">
            <SplitterPanel
              class="flex items-center justify-center bg-blackA8 rounded-lg"
              :min-size="15"
            >
              Primary
            </SplitterPanel>
            <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />

            <template v-if="isShowingExtra">
              <SplitterPanel
                size-unit="px"
                :default-size="180"
                :min-size="140"
                :max-size="260"
                :order="2"
                class="flex items-center justify-center bg-blackA8 rounded-lg"
              >
                Optional (px)
              </SplitterPanel>
              <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
            </template>

            <SplitterPanel
              :order="3"
              class="flex items-center justify-center bg-blackA8 rounded-lg"
            >
              Main content
            </SplitterPanel>
          </SplitterGroup>
        </div>
      </div>
    </Variant>

    <Variant title="Collapsible (px)">
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            class="px-3 py-1.5 text-sm rounded bg-white hover:bg-slate-100 text-slate-800"
            @click="toggleCollapsible"
          >
            {{ collapsibleOpen ? 'Collapse' : 'Expand' }} sidebar
          </button>
        </div>

        <div class="h-48 w-full">
          <SplitterGroup direction="horizontal">
            <SplitterPanel
              ref="collapsiblePanelRef"
              collapsible
              size-unit="px"
              :collapsed-size="48"
              :default-size="200"
              :min-size="140"
              :max-size="260"
              class="flex items-center justify-center bg-blackA8 rounded-lg"
              :data-state="collapsibleOpen ? 'expanded' : 'collapsed'"
              @collapse="handleCollapsed"
              @expand="handleExpanded"
            >
              Collapsible (px)
            </SplitterPanel>
            <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
            <SplitterPanel class="flex items-center justify-center bg-blackA8 rounded-lg">
              Content area
            </SplitterPanel>
          </SplitterGroup>
        </div>
      </div>
    </Variant>
  </Story>
</template>
