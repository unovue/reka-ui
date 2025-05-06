<script setup lang="ts">
import { ref } from 'vue'
import { ComboboxAnchor, ComboboxCancel, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxLabel, ComboboxRoot, ComboboxSeparator, ComboboxTrigger, ComboboxViewport } from '..'
import { Icon } from '@iconify/vue'

const modelValue = ref('Banana')

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
  <Story
    title="Combobox/Cancel"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <ComboboxRoot
        v-model="modelValue"
      >
        <ComboboxAnchor class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
          <ComboboxInput
            class="bg-transparent outline-none text-grass11 placeholder-gray-400"
            placeholder="Test"
          />
          <ComboboxCancel>Clear input</ComboboxCancel>
          <ComboboxTrigger>
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 text-grass11"
            />
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxContent class="mt-2 min-w-[160px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
          <ComboboxViewport class="p-[5px]">
            <ComboboxEmpty class="text-mauve8 text-xs font-medium text-center py-2" />

            <template
              v-for="(group, index) in options"
              :key="group.name"
            >
              <ComboboxGroup>
                <ComboboxSeparator
                  v-if="index !== 0"
                  class="h-[1px] bg-grass6 m-[5px]"
                />

                <ComboboxLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
                  {{ group.name }}
                </ComboboxLabel>

                <ComboboxItem
                  v-for="option in group.children"
                  :key="option.name"
                  :value="option.name"
                  class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                >
                  <ComboboxItemIndicator
                    class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                  >
                    <Icon icon="radix-icons:check" />
                  </ComboboxItemIndicator>
                  <span>
                    {{ option.name }}
                  </span>
                </ComboboxItem>
              </ComboboxGroup>
            </template>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>
  </Story>
</template>
