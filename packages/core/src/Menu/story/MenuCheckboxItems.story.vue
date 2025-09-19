<script setup lang="ts">
import { ref } from 'vue'
import { MenuCheckboxItem, MenuItemIndicator, MenuSeparator } from '..'
import MenuWithAnchor from './_MenuWithAnchor.vue'
import TickIcon from './_TickIcon.vue'

const options = ['Crows', 'Ravens', 'Magpies', 'Jackdaws']

const selection = ref<string[]>([])

function handleSelectAll() {
  if (selection.value.length === options.length)
    selection.value = []
  else selection.value = options
}
</script>

<template>
  <Story
    group="utilities"
    title="Menu/CheckboxItems"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <MenuWithAnchor>
        <MenuCheckboxItem
          class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
          :model-value="
            selection.length === options.length
              ? true
              : selection.length
                ? 'indeterminate'
                : false
          "
          @update:model-value="handleSelectAll"
        >
          Select All
          <MenuItemIndicator>
            <TickIcon v-if="selection.length === options.length" />
          </MenuItemIndicator>
        </MenuCheckboxItem>

        <MenuSeparator class="h-[1px] my-[5px] mx-[10px] bg-gray-200" />

        <MenuCheckboxItem
          v-for="(option, index) in options"
          :key="index"
          class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
          :model-value="selection.includes(option)"
          @update:model-value="
            () => {
              if (selection.includes(option)) {
                selection = selection.filter((el) => el !== option);
              }
              else {
                selection = selection.concat(option);
              }
            }
          "
        >
          {{ option }}

          <MenuItemIndicator>
            <TickIcon />
          </MenuItemIndicator>
        </MenuCheckboxItem>
      </MenuWithAnchor>
    </Variant>
  </Story>
</template>
