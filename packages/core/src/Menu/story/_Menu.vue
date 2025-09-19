<script setup lang="ts">
import type { MenuItemEmits } from '..'
import { MenuGroup, MenuItem, MenuLabel, MenuSeparator } from '..'
import MenuWithAnchor from './_MenuWithAnchor.vue'

const emits = defineEmits<MenuItemEmits>()

const foodGroups: Array<{
  label?: string
  foods: Array<{ value: string, label: string, disabled?: boolean }>
}> = [
  {
    label: 'Fruits',
    foods: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'blueberry', label: 'Blueberry' },
      { value: 'grapes', label: 'Grapes' },
      { value: 'pineapple', label: 'Pineapple' },
    ],
  },
  {
    label: 'Vegetables',
    foods: [
      { value: 'aubergine', label: 'Aubergine' },
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot', disabled: true },
      { value: 'courgette', label: 'Courgette' },
      { value: 'leek', label: 'Leek' },
    ],
  },
  {
    label: 'Meat',
    foods: [
      { value: 'beef', label: 'Beef' },
      { value: 'beef-with-sauce', label: 'Beef with sauce' },
      { value: 'chicken', label: 'Chicken' },
      { value: 'lamb', label: 'Lamb' },
      { value: 'pork', label: 'Pork' },
    ],
  },
  {
    foods: [
      { value: 'candies', label: 'Candies' },
      { value: 'chocolates', label: 'Chocolates' },
    ],
  },
]
</script>

<template>
  <MenuWithAnchor>
    <MenuGroup
      v-for="(foodGroup, index) in foodGroups"
      :key="index"
    >
      <MenuLabel
        v-if="foodGroup.label"
        class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3] text-gray-400 my-2"
      >
        {{ foodGroup.label }}
      </MenuLabel>
      <MenuItem
        v-for="(food, i) in foodGroup.foods"
        :key="i"
        class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
        @select="emits('select', $event)"
      >
        {{ food.label }}
      </MenuItem>
      <MenuSeparator v-if="index < foodGroups.length - 1" />
    </MenuGroup>
  </MenuWithAnchor>
</template>
