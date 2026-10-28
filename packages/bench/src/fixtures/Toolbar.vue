<script setup>
// Toolbar: N instances of a typical composition (closed/default state)
import { ToolbarButton, ToolbarLink, ToolbarRoot, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ToolbarRoot>
      <ToolbarToggleGroup type="multiple">
        <ToolbarToggleItem
          value="b"
          class="tt"
        >
          B
        </ToolbarToggleItem><ToolbarToggleItem value="i">
          I
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarLink href="#">
        Edited
      </ToolbarLink>
      <ToolbarButton>Share</ToolbarButton>
    </ToolbarRoot>
  </div>
</template>
