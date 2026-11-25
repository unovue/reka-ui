<script setup vapor lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarTrigger,
} from '#reka'
import { ref } from 'vue'

const picked = ref('')
const bookmarks = ref(false)
</script>

<template>
  <DropdownMenuRoot>
    <!-- asChild, template form -->
    <DropdownMenuTrigger as-child>
      <button
        id="menu-trigger"
        data-state="mine"
      >
        Menu
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        id="menu-content"
        :side-offset="4"
      >
        <DropdownMenuItem
          v-for="v in ['new', 'open', 'save']"
          :id="`menu-${v}`"
          :key="v"
          @select="picked = v"
        >
          {{ v }}
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          id="menu-bookmarks"
          v-model="bookmarks"
        >
          <DropdownMenuItemIndicator id="menu-bookmarks-indicator">
            ✓
          </DropdownMenuItemIndicator>
          Bookmarks
        </DropdownMenuCheckboxItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger id="menu-more">
            More
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent id="menu-sub">
              <DropdownMenuItem
                id="menu-print"
                @select="picked = 'print'"
              >
                print
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>

  <ContextMenuRoot>
    <!-- asChild, v-slot form -->
    <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
    <ContextMenuTrigger
      v-slot="{ props }"
      as-child
    >
      <div
        v-bind="props"
        id="context-area"
        style="width: 200px; height: 60px; border: 1px dashed"
      >
        Right-click
      </div>
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent id="context-content">
        <ContextMenuItem
          id="context-copy"
          @select="picked = 'copy'"
        >
          copy
        </ContextMenuItem>
        <ContextMenuItem
          id="context-paste"
          @select="picked = 'paste'"
        >
          paste
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>

  <MenubarRoot id="menubar">
    <MenubarMenu
      v-for="m in ['file', 'edit']"
      :key="m"
      :value="m"
    >
      <MenubarTrigger :id="`bar-${m}`">
        {{ m }}
      </MenubarTrigger>
      <MenubarPortal>
        <MenubarContent :id="`bar-${m}-content`">
          <MenubarItem
            :id="`bar-${m}-item`"
            @select="picked = `${m}-item`"
          >
            {{ m }} item
          </MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>

  <span id="picked">{{ picked }}</span>
  <span id="bookmarks">{{ bookmarks }}</span>
  <div
    id="outside"
    style="height: 40px"
  >
    outside
  </div>
</template>
