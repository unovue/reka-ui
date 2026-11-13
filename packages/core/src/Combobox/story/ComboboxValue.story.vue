<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxTrigger, ComboboxValue, ComboboxViewport, createComboboxItems } from '..'

const countries = [
  { code: 'us', name: 'United States' },
  { code: 'de', name: 'Germany' },
  { code: 'jp', name: 'Japan' },
  { code: 'fr', name: 'France' },
]
// The model holds the codes; the labels come from the data.
const items = createComboboxItems(countries, {
  getValue: country => country.code,
  getLabel: country => country.name,
})

const country = ref<string | null>('de')
const selected = ref(['us', 'jp'])
</script>

<template>
  <Story
    title="Combobox/Value"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="single">
      <ComboboxRoot
        v-model="country"
        :items="items"
      >
        <p class="mb-2 text-[13px] text-white">
          Selected: <ComboboxValue placeholder="nothing yet" />
        </p>
        <ComboboxAnchor class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10">
          <ComboboxInput
            class="bg-transparent outline-none text-grass11 placeholder-gray-400"
            placeholder="Select a country"
          />
          <ComboboxTrigger>
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 text-grass11"
            />
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxContent class="mt-2 min-w-[160px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35)]">
          <ComboboxViewport class="p-[5px]">
            <ComboboxEmpty class="text-mauve8 text-xs font-medium text-center py-2" />
            <ComboboxItem
              v-for="item in countries"
              :key="item.code"
              class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
              :value="item.code"
            >
              <ComboboxItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                <Icon icon="radix-icons:check" />
              </ComboboxItemIndicator>
              {{ item.name }}
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>

    <Variant title="chips with TagsInput">
      <ComboboxRoot
        v-model="selected"
        multiple
        :items="items"
      >
        <ComboboxAnchor class="w-[400px] inline-flex items-center justify-between rounded-lg p-2 text-[13px] leading-none gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10">
          <ComboboxValue v-slot="{ selectedLabels }">
            <TagsInputRoot
              v-model="selected"
              delimiter=""
              class="flex gap-2 items-center rounded-lg flex-wrap"
            >
              <TagsInputItem
                v-for="(code, index) in selected"
                :key="code"
                :value="code"
                class="flex items-center justify-center gap-2 text-white bg-grass8 aria-[current=true]:bg-grass9 rounded px-2 py-1"
              >
                <TagsInputItemText class="text-sm">
                  {{ selectedLabels[index] }}
                </TagsInputItemText>
                <TagsInputItemDelete>
                  <Icon icon="lucide:x" />
                </TagsInputItemDelete>
              </TagsInputItem>

              <ComboboxInput as-child>
                <TagsInputInput
                  placeholder="Add a country"
                  class="focus:outline-none flex-1 rounded !bg-transparent placeholder:text-mauve10 px-1"
                  @keydown.enter.prevent
                />
              </ComboboxInput>
            </TagsInputRoot>
          </ComboboxValue>

          <ComboboxTrigger>
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 text-grass11"
            />
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxContent class="mt-2 w-[400px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35)]">
          <ComboboxViewport class="p-[5px]">
            <ComboboxEmpty class="text-mauve8 text-xs font-medium text-center py-2" />
            <ComboboxItem
              v-for="item in countries"
              :key="item.code"
              class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
              :value="item.code"
            >
              <ComboboxItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                <Icon icon="radix-icons:check" />
              </ComboboxItemIndicator>
              {{ item.name }}
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>
  </Story>
</template>
