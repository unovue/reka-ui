<script setup lang="ts">
import type { Folder } from './folders'
import { Icon } from '@iconify/vue'
import { CheckboxIndicator, CheckboxRoot, SwitchRoot, SwitchThumb, TreeItem, TreeRoot } from 'reka-ui'
import { ref } from 'vue'
import { folders } from './folders'

const selected = ref<Folder[]>([])
const expanded = ref(['Documents'])

// Both props are toggleable here so the two halves of the behaviour are visible
// on their own: `propagateSelect` pushes a choice down to descendants,
// `bubbleSelect` pulls the parent's state up from its children.
const propagateSelect = ref(true)
const bubbleSelect = ref(true)

const switchClass = 'w-8 h-[18px] flex rounded-full relative transition data-[state=unchecked]:bg-muted-foreground/30 data-[state=checked]:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40'
</script>

<template>
  <div class="flex w-[320px] flex-col gap-3">
    <div class="flex flex-col gap-2 rounded-xl border border-muted bg-card p-3 text-xs">
      <label class="flex items-center justify-between gap-3 text-foreground">
        <span><code class="font-mono">propagate-select</code></span>
        <SwitchRoot
          v-model="propagateSelect"
          :class="switchClass"
        >
          <SwitchThumb class="my-auto size-3.5 translate-x-0.5 rounded-full bg-white transition-transform will-change-transform data-[state=checked]:translate-x-full" />
        </SwitchRoot>
      </label>
      <label class="flex items-center justify-between gap-3 text-foreground">
        <span><code class="font-mono">bubble-select</code></span>
        <SwitchRoot
          v-model="bubbleSelect"
          :class="switchClass"
        >
          <SwitchThumb class="my-auto size-3.5 translate-x-0.5 rounded-full bg-white transition-transform will-change-transform data-[state=checked]:translate-x-full" />
        </SwitchRoot>
      </label>
    </div>

    <TreeRoot
      v-slot="{ flattenItems }"
      v-model="selected"
      v-model:expanded="expanded"
      class="select-none rounded-xl border border-muted bg-card p-2 text-sm"
      :items="folders"
      :get-key="(item) => item.name"
      :get-children="(item) => item.children"
      :propagate-select="propagateSelect"
      :bubble-select="bubbleSelect"
      multiple
    >
      <p class="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Folders to sync
      </p>

      <TreeItem
        v-for="item in flattenItems"
        v-slot="{ isExpanded, isSelected, isIndeterminate, handleToggle }"
        :key="item._id"
        v-bind="item.bind"
        class="flex items-center gap-2 rounded-md py-1.5 pr-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40 data-[selected]:bg-muted"
        :style="{ paddingLeft: `${(item.level - 1) * 0.75 + 0.5}rem` }"
      >
        <button
          v-if="item.hasChildren"
          type="button"
          class="shrink-0 rounded text-muted-foreground hover:text-foreground focus:outline-none"
          :aria-label="isExpanded ? 'Collapse' : 'Expand'"
          tabindex="-1"
          @click.stop="handleToggle"
        >
          <Icon
            icon="lucide:chevron-right"
            class="size-4 transition-transform"
            :class="isExpanded && 'rotate-90'"
          />
        </button>
        <span
          v-else
          class="size-4 shrink-0"
        />

        <!-- `isIndeterminate` is what `bubble-select` produces on a parent whose
             children are only partly selected. -->
        <CheckboxRoot
          :model-value="isIndeterminate ? 'indeterminate' : isSelected"
          class="pointer-events-none grid size-4 shrink-0 place-items-center rounded border border-muted-foreground/40 bg-background data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary"
          tabindex="-1"
          aria-hidden="true"
        >
          <CheckboxIndicator class="text-primary-foreground">
            <Icon
              :icon="isIndeterminate ? 'lucide:minus' : 'lucide:check'"
              class="size-3"
            />
          </CheckboxIndicator>
        </CheckboxRoot>

        <Icon
          :icon="item.hasChildren ? 'lucide:folder' : 'lucide:hard-drive'"
          class="size-4 shrink-0 text-muted-foreground"
        />
        <span class="min-w-0 flex-1 truncate">{{ item.value.name }}</span>
        <span class="shrink-0 text-xs text-muted-foreground">{{ item.value.size }}</span>
      </TreeItem>
    </TreeRoot>

    <p class="text-xs text-muted-foreground">
      {{ selected.length }} selected:
      {{ selected.map(folder => folder.name).join(', ') || 'none' }}
    </p>
  </div>
</template>
