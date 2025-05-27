<script setup lang="ts">
import type { PinInputRootEmits, PinInputRootProps } from '..'
import { ref } from 'vue'
import { Label } from '@/Label'
import { useEmitAsProps } from '@/shared'
import { PinInputInput, PinInputRoot } from '..'

const props = defineProps<PinInputRootProps>()
const emits = defineEmits<PinInputRootEmits>()

const value = ref<string[]>([])
</script>

<template>
  <Label for="otp">Test label</Label>
  <PinInputRoot
    v-bind="{ ...props, ...useEmitAsProps(emits) }"
    v-model="value"
    placeholder="*"
    class="flex gap-2 items-center"
  >
    <PinInputInput
      v-for="(id, index) in 5"
      :key="id"
      class="w-10 h-10 rounded text-center text-green10 placeholder:text-mauve5"
      :index="index"
    />
  </PinInputRoot>

  <button @click="value = []">
    Reset value
  </button>
</template>
