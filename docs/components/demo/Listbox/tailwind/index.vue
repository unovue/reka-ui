<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ListboxContent, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxItemIndicator, ListboxRoot } from 'reka-ui'

const fruits = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
const vegetables = ['Aubergine', 'Broccoli', 'Carrot', 'Courgette', 'Leek']
</script>

<template>
  <ListboxRoot class=" flex flex-col rounded-lg shadow-sm border dark:border-stone-900 overflow-hidden bg-white text-grass9 mx-auto ">
    <ListboxContent class="p-[5px] w-48 h-72 overflow-auto">
      <ListboxGroup>
        <ListboxGroupLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
          Fruits
        </ListboxGroupLabel>
        <ListboxItem
          v-for="i in fruits"
          :key="i"
          :value="i"
          class="w-full flex items-center px-[25px] h-[25px] leading-none text-xs relative text-grass9 select-none outline-none data-[highlighted]:ring-grass9 data-[highlighted]:ring-1 focus:ring-grass9 focus:ring-1  data-[state=checked]:bg-grass9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          <ListboxItemIndicator
            class="absolute left-0 w-[25px] inline-flex items-center justify-center"
          >
            <Icon icon="radix-icons:check" />
          </ListboxItemIndicator>
          <span>{{ i }}</span>
        </ListboxItem>
      </ListboxGroup>

      <ListboxGroup class="mt-2">
        <ListboxGroupLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
          Vegetables
        </ListboxGroupLabel>
        <ListboxItem
          v-for="i in vegetables"
          :key="i"
          :value="i"
          class="w-full flex items-center px-[25px] h-[25px] leading-none text-xs relative text-grass9 select-none outline-none data-[highlighted]:ring-grass9 data-[highlighted]:ring-1 focus:ring-grass9 focus:ring-1  data-[state=checked]:bg-grass9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          <ListboxItemIndicator
            class="absolute left-0 w-[25px] inline-flex items-center justify-center"
          >
            <Icon icon="radix-icons:check" />
          </ListboxItemIndicator>
          <span>{{ i }}</span>
        </ListboxItem>
      </ListboxGroup>
    </ListboxContent>
  </ListboxRoot>
</template>
