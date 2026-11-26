<script setup vapor lang="ts">
import { CheckboxIndicator, CheckboxRoot, CollapsibleContent, CollapsibleRoot, CollapsibleTrigger, Toggle } from '#reka'
import { ref } from 'vue'

const checked = ref<boolean | 'indeterminate'>(false)
const pressed = ref(false)
const open = ref(false)
const adopted = ref(false)
const slotted = ref(false)
const clicks = ref(0)
</script>

<template>
  <form
    id="form"
    @submit.prevent
  >
    <CheckboxRoot
      id="checkbox"
      v-model="checked"
      name="terms"
      aria-label="Accept"
    >
      <CheckboxIndicator id="checkbox-indicator">
        ✓
      </CheckboxIndicator>
    </CheckboxRoot>
  </form>
  <span id="checked">{{ checked }}</span>

  <Toggle
    id="toggle"
    v-model="pressed"
    aria-label="Bold"
  >
    B
  </Toggle>
  <span id="pressed">{{ pressed }}</span>

  <CollapsibleRoot v-model:open="open">
    <CollapsibleTrigger id="collapsible-trigger">
      Toggle
    </CollapsibleTrigger>
    <CollapsibleContent id="collapsible-content">
      Hidden content
    </CollapsibleContent>
  </CollapsibleRoot>
  <span id="open">{{ open }}</span>

  <!-- asChild, both forms -->
  <CheckboxRoot
    v-model="adopted"
    as-child
  >
    <button
      id="checkbox-adopted"
      aria-label="Adopted"
      data-state="mine"
      class="mine"
      @click="clicks++"
    >
      adopted
    </button>
  </CheckboxRoot>
  <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
  <Toggle
    v-slot="{ props, modelValue }"
    v-model="slotted"
    as-child
  >
    <button
      v-bind="props"
      id="toggle-slotted"
      aria-label="Slotted"
      @click="clicks++"
    >
      {{ modelValue ? 'on' : 'off' }}
    </button>
  </Toggle>
  <span id="clicks">{{ clicks }}</span>
</template>
