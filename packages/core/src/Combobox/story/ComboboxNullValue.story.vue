<script setup lang="ts">
import { ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxViewport } from '..'

// `null` is the empty value (the "None" item clears); `''` is an ordinary value.
const items = [
  { value: null, label: 'None' },
  { value: '', label: 'Empty string' },
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
]
const single = ref<string | null>(null)
const multiple = ref<(string | null)[]>([])
const label = (value: string | null) => items.find(item => item.value === value)?.label ?? ''
const submitted = ref('')
function onSubmit(event: Event) {
  submitted.value = JSON.stringify([...new FormData(event.target as HTMLFormElement)])
}
</script>

<template>
  <Story
    title="Combobox/Null and empty values"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant
      v-for="variant in (['single', 'multiple'] as const)"
      :key="variant"
      :title="variant"
    >
      <form
        class="flex flex-col gap-2"
        @submit.prevent="onSubmit"
      >
        <ComboboxRoot
          v-if="variant === 'single'"
          v-model="single"
          name="fruit"
          required
          :display-value="label"
        >
          <ComboboxAnchor class="min-w-[160px] inline-flex items-center rounded px-[15px] h-[35px] bg-white shadow-[0_2px_10px] shadow-black/10">
            <ComboboxInput
              class="bg-transparent outline-none text-grass11 placeholder-gray-400"
              placeholder="Pick a fruit"
            />
          </ComboboxAnchor>
          <ComboboxContent class="mt-2 min-w-[160px] bg-white rounded shadow-lg">
            <ComboboxViewport class="p-[5px]">
              <ComboboxItem
                v-for="item in items"
                :key="String(item.value)"
                :value="item.value"
                :text-value="item.label"
                class="text-[13px] text-grass11 rounded-[3px] flex items-center h-[25px] pl-[25px] relative select-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
              >
                <ComboboxItemIndicator class="absolute left-0 w-[25px] inline-flex justify-center">
                  ✓
                </ComboboxItemIndicator>
                {{ item.label }}
              </ComboboxItem>
            </ComboboxViewport>
          </ComboboxContent>
        </ComboboxRoot>
        <ComboboxRoot
          v-else
          v-model="multiple"
          name="fruits"
          multiple
          required
        >
          <ComboboxAnchor class="min-w-[160px] inline-flex items-center rounded px-[15px] h-[35px] bg-white shadow-[0_2px_10px] shadow-black/10">
            <ComboboxInput
              class="bg-transparent outline-none text-grass11 placeholder-gray-400"
              placeholder="Pick fruits"
            />
          </ComboboxAnchor>
          <ComboboxContent class="mt-2 min-w-[160px] bg-white rounded shadow-lg">
            <ComboboxViewport class="p-[5px]">
              <ComboboxItem
                v-for="item in items"
                :key="String(item.value)"
                :value="item.value"
                :text-value="item.label"
                class="text-[13px] text-grass11 rounded-[3px] flex items-center h-[25px] pl-[25px] relative select-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
              >
                <ComboboxItemIndicator class="absolute left-0 w-[25px] inline-flex justify-center">
                  ✓
                </ComboboxItemIndicator>
                {{ item.label }}
              </ComboboxItem>
            </ComboboxViewport>
          </ComboboxContent>
        </ComboboxRoot>
        <p class="text-sm">
          Model: {{ JSON.stringify(variant === 'single' ? single : multiple) }}
        </p>
        <button type="submit">
          Submit
        </button>
        <p class="text-sm">
          Submitted: {{ submitted }}
        </p>
      </form>
    </Variant>
  </Story>
</template>
