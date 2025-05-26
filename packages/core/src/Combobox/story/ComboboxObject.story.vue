<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { useFilter } from '@/shared'
import { ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxLabel, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '..'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]

const vegetables = ['Aubergine', 'Broccoli', 'Carrot', 'Courgette', 'Leek'].map((v, i) => ({ id: i, name: v }))

const { contains } = useFilter({ sensitivity: 'base' })
const v1 = ref(people[0])
const searchTerm1 = ref('')
const filteredPeople = computed(() => people.filter(i => contains(i.name, searchTerm1.value)))

const v2 = ref(vegetables[0])
const searchTerm2 = ref('')
const filteredVege = computed(() => vegetables.filter(i => contains(i.name, searchTerm2.value)))
</script>

<template>
  <Story
    title="Combobox/Object"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant
      title="Display Value"
      auto-props-disabled
    >
      <ComboboxRoot
        v-model="v1"
        by="name"
        ignore-filter
      >
        <ComboboxAnchor class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
          <ComboboxInput
            v-model="searchTerm1"
            :display-value="(ev: typeof people[0]) => {
              return ev.name
            }"
            class="bg-transparent outline-none text-grass11 placeholder-gray-400"
            placeholder="Test"
          />
          <ComboboxTrigger>
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 text-grass11"
            />
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxContent class="mt-2 min-w-[160px] overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
          <ComboboxViewport class="p-[5px] bg-white empty:invisible">
            <ComboboxGroup v-if="filteredPeople.length">
              <ComboboxLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
                People
              </ComboboxLabel>

              <ComboboxItem
                v-for="option in filteredPeople"
                :key="option.id"
                class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                :value="option"
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
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>

    <Variant
      title="Filtering"
      auto-props-disabled
    >
      <ComboboxRoot
        v-model="v2"
        by="name"
        ignore-filter
      >
        <ComboboxAnchor class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
          <ComboboxInput
            v-model="searchTerm2"
            class="bg-transparent outline-none text-grass11 placeholder-gray-400"
            placeholder="Test"
          />
          <ComboboxTrigger>
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 text-grass11"
            />
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxContent class="mt-2 min-w-[160px] overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
          <ComboboxViewport class="p-[5px] bg-white empty:invisible">
            <ComboboxGroup v-if="filteredVege.length">
              <ComboboxLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
                Vegetables
              </ComboboxLabel>

              <ComboboxItem
                v-for="option in filteredVege"
                :key="option.id"
                class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                :value="option"
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
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>
  </Story>
</template>
