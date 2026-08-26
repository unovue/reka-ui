<script setup lang="ts">
import type { FileNode } from './files'
import { Icon } from '@iconify/vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuSeparator, ContextMenuTrigger, EditableArea, EditableInput, EditablePreview, EditableRoot, TreeItem, TreeRoot } from 'reka-ui'
import { nextTick, ref } from 'vue'
import { initialFiles, locate, uniqueName } from './files'

const files = ref<FileNode[]>(structuredClone(initialFiles))
const expanded = ref(['components'])
/** Name of the node currently in rename mode — at most one at a time. */
const renaming = ref<string | undefined>()

function startRename(node: FileNode) {
  renaming.value = node.name
}

function commitRename(node: FileNode, value: string | null | undefined) {
  renaming.value = undefined

  const next = value?.trim()
  const found = locate(files.value, node.name)
  if (!next || !found || next === node.name)
    return

  // `getKey` is the node name, so a duplicate would break Tree's keying.
  const resolved = uniqueName(found.parent, next, node)
  // Keep the folder expanded under its new key.
  expanded.value = expanded.value.map(key => key === node.name ? resolved : key)
  node.name = resolved
}

function remove(node: FileNode) {
  const found = locate(files.value, node.name)
  if (!found)
    return
  found.parent.splice(found.parent.indexOf(node), 1)
}

async function addFile(node: FileNode) {
  const folder = node.children ? node : locate(files.value, node.name)?.parent
  if (!folder)
    return

  const siblings = Array.isArray(folder) ? folder : folder.children!
  const created: FileNode = {
    name: uniqueName(siblings, 'untitled.ts'),
    icon: 'vscode-icons:file-type-typescript',
  }
  siblings.push(created)

  if (node.children && !expanded.value.includes(node.name))
    expanded.value = [...expanded.value, node.name]

  // Wait for the row to exist before switching it into edit mode.
  await nextTick()
  startRename(created)
}

const menuItemClass = 'flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none data-[highlighted]:bg-muted'
</script>

<template>
  <TreeRoot
    v-slot="{ flattenItems }"
    v-model:expanded="expanded"
    class="w-[280px] select-none rounded-xl border border-muted bg-card p-2 text-sm"
    :items="files"
    :get-key="(item) => item.name"
    :get-children="(item) => item.children"
  >
    <p class="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      Explorer
    </p>

    <ContextMenuRoot
      v-for="item in flattenItems"
      :key="item._id"
    >
      <ContextMenuTrigger as-child>
        <TreeItem
          v-slot="{ isExpanded }"
          v-bind="item.bind"
          class="group flex items-center gap-1.5 rounded-md py-1 pr-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40 data-[selected]:bg-muted"
          :style="{ paddingLeft: `${(item.level - 1) * 0.75 + 0.5}rem` }"
          @select="renaming === item.value.name && $event.preventDefault()"
        >
          <Icon
            v-if="item.hasChildren"
            :icon="isExpanded ? 'lucide:folder-open' : 'lucide:folder'"
            class="size-4 shrink-0 text-muted-foreground"
          />
          <Icon
            v-else
            :icon="item.value.icon ?? 'lucide:file'"
            class="size-4 shrink-0"
          />

          <!-- Editable swaps the label for an input in place. `start-with-edit-mode`
               means a freshly created file lands ready to be named. -->
          <EditableRoot
            v-if="renaming === item.value.name"
            :default-value="item.value.name"
            class="min-w-0 flex-1"
            activation-mode="none"
            submit-mode="both"
            select-on-focus
            start-with-edit-mode
            auto-resize
            @submit="commitRename(item.value, $event)"
            @update:state="$event === 'cancel' && (renaming = undefined)"
          >
            <EditableArea>
              <EditablePreview class="truncate" />
              <EditableInput class="w-full rounded bg-background px-1 outline-none ring-2 ring-primary/40" />
            </EditableArea>
          </EditableRoot>
          <span
            v-else
            class="min-w-0 flex-1 truncate"
          >{{ item.value.name }}</span>

          <button
            type="button"
            class="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:bg-background focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/40 group-hover:opacity-100"
            :aria-label="`Rename ${item.value.name}`"
            @click.stop="startRename(item.value)"
          >
            <Icon
              icon="lucide:pencil"
              class="size-3.5"
            />
          </button>
        </TreeItem>
      </ContextMenuTrigger>

      <ContextMenuPortal>
        <ContextMenuContent class="z-[100] min-w-[11rem] rounded-lg border border-muted bg-card p-1 shadow-lg">
          <ContextMenuItem
            :class="menuItemClass"
            @select="addFile(item.value)"
          >
            <Icon
              icon="lucide:file-plus"
              class="size-4"
            />
            New file
          </ContextMenuItem>
          <ContextMenuItem
            :class="menuItemClass"
            @select="startRename(item.value)"
          >
            <Icon
              icon="lucide:pencil"
              class="size-4"
            />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator class="my-1 h-px bg-muted" />
          <ContextMenuItem
            class="text-destructive"
            :class="[menuItemClass]"
            @select="remove(item.value)"
          >
            <Icon
              icon="lucide:trash-2"
              class="size-4"
            />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenuRoot>
  </TreeRoot>
</template>
