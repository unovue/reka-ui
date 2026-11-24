<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteEmpty, AutocompleteGroup, AutocompleteInput, AutocompleteItem, AutocompleteLabel, AutocompleteRoot, AutocompleteSeparator, AutocompleteTrigger, AutocompleteViewport } from 'reka-ui'
import { ref } from 'vue'

const v = ref('')

const options = [
  { name: 'Fruit', children: [
    { name: 'Apple' },
    { name: 'Banana' },
    { name: 'Orange' },
    { name: 'Honeydew' },
    { name: 'Grapes' },
    { name: 'Watermelon' },
    { name: 'Cantaloupe' },
    { name: 'Pear' },
  ] },
  { name: 'Vegetable', children: [
    { name: 'Cabbage' },
    { name: 'Broccoli' },
    { name: 'Carrots' },
    { name: 'Lettuce' },
    { name: 'Spinach' },
    { name: 'Bok Choy' },
    { name: 'Cauliflower' },
    { name: 'Potatoes' },
  ] },
]
</script>

<template>
  <AutocompleteRoot
    v-model="v"
    class="relative"
  >
    <AutocompleteAnchor class="min-w-[160px] inline-flex items-center justify-between rounded-lg border px-[15px] text-xs leading-none h-[35px] gap-[5px] bg-white text-grass11 hover:bg-stone-50 shadow-sm focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
      <AutocompleteInput
        class="!bg-transparent outline-none text-grass11 h-full selection:bg-grass5 placeholder-stone-400"
        placeholder="Type or select an option..."
      />
      <AutocompleteTrigger>
        <Icon
          icon="radix-icons:chevron-down"
          class="h-4 w-4 text-grass11"
        />
      </AutocompleteTrigger>
    </AutocompleteAnchor>

    <AutocompleteContent class="absolute z-10 w-full mt-1 min-w-[160px] bg-white overflow-hidden rounded-lg shadow-sm border will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
      <AutocompleteViewport class="p-[5px]">
        <AutocompleteEmpty class="text-mauve8 text-xs font-medium text-center py-2" />

        <template
          v-for="(group, index) in options"
          :key="group.name"
        >
          <AutocompleteGroup>
            <AutocompleteSeparator
              v-if="index !== 0"
              class="h-[1px] bg-grass6 m-[5px]"
            />

            <AutocompleteLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
              {{ group.name }}
            </AutocompleteLabel>

            <AutocompleteItem
              v-for="option in group.children"
              :key="option.name"
              :value="option.name"
              class="text-xs leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
            >
              <span>
                {{ option.name }}
              </span>
            </AutocompleteItem>
          </AutocompleteGroup>
        </template>
      </AutocompleteViewport>
    </AutocompleteContent>
  </AutocompleteRoot>
</template>
