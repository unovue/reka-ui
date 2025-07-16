<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '..'

const panelRef = ref<InstanceType<typeof SplitterPanel>>()

onMounted(() => {
  // eslint-disable-next-line no-console
  console.log(panelRef.value?.$el)
  // eslint-disable-next-line no-console
  console.log(panelRef.value?.getSize())
})
</script>

<template>
  <Story
    title="Splitter/Action"
    :layout="{ type: 'single', width: '100%', iframe: false }"
  >
    <Variant title="default">
      <div>
        <button
          class="px-3 py-1.5 text-sm rounded bg-white hover:bg-slate-100 text-slate-800"
          @click="panelRef?.isCollapsed ? panelRef?.expand() : panelRef?.collapse() "
        >
          {{ panelRef?.isCollapsed ? 'Expand' : 'Collapse' }}
        </button>

        <button
          class="ml-2 px-3 py-1.5 text-sm rounded bg-white hover:bg-slate-100 text-slate-800"
          @click="panelRef?.resize(20)"
        >
          Resize to 20
        </button>

        <div class="w-full h-48 mt-4">
          <SplitterGroup direction="horizontal">
            <SplitterPanel
              ref="panelRef"
              collapsible
              :collapsed-size="5"
              :default-size="20"
              :max-size="30"
              :min-size="15"
              class="bg-blackA8 rounded-lg"
            >
              <div class="p-4">
                Collapsible
              </div>
            </SplitterPanel>
            <SplitterResizeHandle class="w-2 data-[state=active]:bg-white transition" />
            <SplitterPanel class="bg-blackA8 rounded-lg ">
              <div class="h-full overflow-auto">
                <div class="h-96 w-[30vw] p-4">
                  Non-collapsible
                </div>
              </div>
            </SplitterPanel>
          </SplitterGroup>
        </div>
      </div>
    </Variant>
  </Story>
</template>
