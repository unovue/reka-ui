<script setup vapor lang="ts">
import { Label, SwitchRoot, SwitchThumb } from '#reka'
import { ref } from 'vue'

const on = ref(false)
const adopted = ref(false)
const slotted = ref(false)
const clicks = ref(0)
const rootRef = ref()
defineExpose({ on, adopted, slotted, clicks, rootRef })
</script>

<template>
  <form
    id="form"
    @submit.prevent
  >
    <Label for="airplane">Airplane mode</Label>
    <SwitchRoot
      id="airplane"
      ref="rootRef"
      v-model="on"
      name="airplane"
      class="switch"
    >
      <SwitchThumb id="thumb" />
    </SwitchRoot>
  </form>
  <span id="state">{{ on }}</span>

  <!-- asChild, v2 template form: the child's own attributes win, listeners merge -->
  <SwitchRoot
    v-model="adopted"
    as-child
  >
    <button
      id="adopted"
      data-state="mine"
      aria-label="Adopted"
      class="mine"
      @click="clicks++"
    >
      adopted
    </button>
  </SwitchRoot>

  <!-- asChild, scoped-slot form: the consumer binds `props` and picks precedence by order -->
  <SwitchRoot
    v-slot="{ props }"
    v-model="slotted"
    as-child
  >
    <button
      v-bind="props"
      id="slotted"
      aria-label="Slotted"
      @click="clicks++"
    >
      slotted
    </button>
  </SwitchRoot>
</template>
