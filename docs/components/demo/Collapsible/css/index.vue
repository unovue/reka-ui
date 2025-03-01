<script setup lang="ts">
import { ref } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { Icon } from '@iconify/vue'
import './styles.css'

const open = ref(false)
</script>

<template>
  <CollapsibleRoot
    v-model:open="open"
    class="CollapsibleRoot"
  >
    <div style="display: flex; align-items: center; justify-content: space-between">
      <span class="Text"> @peduarte starred 3 repos </span>
      <CollapsibleTrigger
        class="IconButton"
      >
        <Icon
          v-if="open"
          icon="radix-icons:cross-2"
        />
        <Icon
          v-else
          icon="radix-icons:row-spacing"
        />
      </CollapsibleTrigger>
    </div>

    <div class="Repository">
      <span class="Text">@unovue/reka-ui</span>
    </div>

    <CollapsibleContent>
      <div class="Repository">
        <span class="Text">@vuejs/core</span>
      </div>
      <div class="Repository">
        <span class="Text">@radix-ui/primitives</span>
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
