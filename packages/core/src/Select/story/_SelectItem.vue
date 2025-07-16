<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { SelectItem, SelectItemIndicator, SelectItemText } from '..'

defineProps<{
  options: string[]
}>()
</script>

<template>
  <SelectItem
    v-for="(option, index) in options"
    :key="index"
    class="text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
    :value="option"
  >
    <SelectItemIndicator
      class="absolute left-0 w-[25px] inline-flex items-center justify-center"
    >
      <Icon icon="radix-icons:check" />
    </SelectItemIndicator>
    <SelectItemText>
      {{ option }}
    </SelectItemText>
  </SelectItem>
</template>
