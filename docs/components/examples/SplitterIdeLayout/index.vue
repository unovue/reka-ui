<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import { ref } from 'vue'

const files = [
  { name: 'app.vue', icon: 'lucide:file-code' },
  { name: 'router.ts', icon: 'lucide:file-code' },
  { name: 'store.ts', icon: 'lucide:file-code' },
  { name: 'main.css', icon: 'lucide:file-type' },
  { name: 'README.md', icon: 'lucide:file-text' },
]

const sidebar = ref<InstanceType<typeof SplitterPanel>>()
const terminal = ref<InstanceType<typeof SplitterPanel>>()

/** `collapse()`/`expand()` remember the size the panel had before collapsing. */
function toggle(panel?: InstanceType<typeof SplitterPanel>) {
  if (!panel)
    return
  if (panel.isCollapsed)
    panel.expand()
  else
    panel.collapse()
}

const railButtonClass = 'grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'
</script>

<template>
  <div class="flex h-[340px] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-muted bg-card text-sm">
    <div class="flex items-center gap-1 border-b border-muted px-2 py-1.5">
      <button
        type="button"
        :class="railButtonClass"
        aria-label="Toggle sidebar"
        @click="toggle(sidebar)"
      >
        <Icon
          icon="lucide:panel-left"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="railButtonClass"
        aria-label="Toggle terminal"
        @click="toggle(terminal)"
      >
        <Icon
          icon="lucide:panel-bottom"
          class="size-4"
        />
      </button>
      <span class="ml-2 truncate text-xs text-muted-foreground">
        Layout is restored from <code class="font-mono">localStorage</code> on reload
      </span>
    </div>

    <!-- `auto-save-id` writes the panel sizes to localStorage and reads them
         back on mount, so a refresh does not throw the layout away. -->
    <SplitterGroup
      id="reka-ide"
      class="flex-1"
      direction="horizontal"
      auto-save-id="reka-example-ide"
    >
      <SplitterPanel
        id="reka-ide-sidebar"
        ref="sidebar"
        :default-size="28"
        :min-size="16"
        :collapsed-size="0"
        collapsible
        class="overflow-hidden"
      >
        <div class="h-full overflow-y-auto p-2">
          <p class="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Explorer
          </p>
          <ul>
            <li
              v-for="file in files"
              :key="file.name"
              class="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-foreground hover:bg-muted"
            >
              <Icon
                :icon="file.icon"
                class="size-3.5 shrink-0 text-muted-foreground"
              />
              <span class="truncate">{{ file.name }}</span>
            </li>
          </ul>
        </div>
      </SplitterPanel>

      <SplitterResizeHandle
        id="reka-ide-handle-x"
        class="group relative w-px bg-muted data-[state=drag]:bg-primary"
      >
        <span class="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/20" />
      </SplitterResizeHandle>

      <SplitterPanel
        id="reka-ide-main"
        :min-size="30"
      >
        <SplitterGroup
          id="reka-ide-main-group"
          direction="vertical"
          auto-save-id="reka-example-ide-main"
        >
          <SplitterPanel
            id="reka-ide-editor"
            :default-size="68"
            :min-size="25"
            class="overflow-hidden"
          >
            <!-- `v-pre` keeps Vue from treating the sample's mustaches as interpolation. -->
            <pre
              v-pre
              class="h-full overflow-auto p-3 font-mono text-xs leading-relaxed text-muted-foreground"
            ><span class="text-foreground">&lt;script setup&gt;</span>
import { ref } from 'vue'

const count = ref(0)
<span class="text-foreground">&lt;/script&gt;</span>

<span class="text-foreground">&lt;template&gt;</span>
  &lt;button @click="count++"&gt;
    {{ count }}
  &lt;/button&gt;
<span class="text-foreground">&lt;/template&gt;</span></pre>
          </SplitterPanel>

          <SplitterResizeHandle
            id="reka-ide-handle-y"
            class="group relative h-px bg-muted data-[state=drag]:bg-primary"
          >
            <span class="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-primary/20" />
          </SplitterResizeHandle>

          <SplitterPanel
            id="reka-ide-terminal"
            ref="terminal"
            :default-size="32"
            :min-size="15"
            :collapsed-size="0"
            collapsible
            class="overflow-hidden"
          >
            <div class="h-full overflow-auto bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
              <p class="text-foreground">
                $ pnpm dev
              </p>
              <p>VITE v6.0.0  ready in 231 ms</p>
              <p>➜  Local:   http://localhost:5173/</p>
            </div>
          </SplitterPanel>
        </SplitterGroup>
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>
