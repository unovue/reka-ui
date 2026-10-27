<script setup lang="ts">
import type { PinInputRootEmits, PinInputRootProps } from '..'
import type { PinInputType, PinInputValue } from '../PinInputRoot.vue'
import { ref } from 'vue'
import { Label } from '@/Label'
import { useEmitAsProps } from '@/shared'
import { PinInputInput, PinInputRoot } from '..'

// `PinInputValue<PinInputType>` resolves to `string[]`; the fixture serves both modes.
type Value = PinInputValue<'text'> | PinInputValue<'number'>

const props = defineProps<Omit<PinInputRootProps<PinInputType>, 'modelValue' | 'defaultValue'> & {
  modelValue?: Value | null
  defaultValue?: Value
}>()
const emits = defineEmits<PinInputRootEmits<PinInputType>>()

const value = ref<Value>([])
</script>

<template>
  <Label for="otp">Test label</Label>
  <PinInputRoot
    v-bind="{ ...props, ...useEmitAsProps(emits) } as PinInputRootProps<PinInputType>"
    :model-value="value as PinInputValue<PinInputType>"
    placeholder="*"
    class="flex gap-2 items-center"
    @update:model-value="value = $event"
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
