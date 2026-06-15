<script setup lang="ts">
import ComboboxMultipleShadowRoot from './components/_ComboboxMultiple.vue'
import DropdownShadowRoot from './components/_Dropdown.vue'
import PopoverShadowRoot from './components/_Popover.vue'

defineProps<{ portalTarget?: HTMLDivElement }>()
</script>

<template>
  <div class="flex gap-2">
    <ComboboxMultipleShadowRoot :portal-target="portalTarget" />
    <DropdownShadowRoot
      :portal-target="portalTarget"
      :modal="false"
    />
    <DropdownShadowRoot
      :portal-target="portalTarget"
      :modal="true"
    />

    <PopoverShadowRoot
      :portal-target="portalTarget"
      :modal="false"
    />
    <PopoverShadowRoot
      :portal-target="portalTarget"
      :modal="true"
    />
  </div>
</template>
