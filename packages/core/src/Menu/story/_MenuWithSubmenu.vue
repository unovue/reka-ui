<script setup lang="ts">
import {
  MenuAnchor,
  MenuContent,
  MenuItem,
  MenuPortal,
  MenuRoot,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from '..'
</script>

<template>
  <MenuRoot
    :open="true"
    :modal="false"
  >
    <MenuAnchor :style="{ display: 'inline-block' }" />
    <MenuPortal disabled>
      <MenuContent
        align="start"
        @close-auto-focus.prevent
      >
        <MenuItem>
          Item 1
        </MenuItem>
        <MenuSub>
          <MenuSubTrigger>
            Sub Trigger
          </MenuSubTrigger>
          <MenuPortal disabled>
            <MenuSubContent>
              <MenuItem>
                Sub Item 1
              </MenuItem>
              <MenuItem>
                Sub Item 2
              </MenuItem>
            </MenuSubContent>
          </MenuPortal>
        </MenuSub>
        <MenuItem>
          Item 2
        </MenuItem>
      </MenuContent>
    </MenuPortal>
  </MenuRoot>
</template>
