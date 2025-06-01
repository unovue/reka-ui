<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { useFilter } from '@/shared'
import { countryList } from '@/shared/constant'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxTrigger, ComboboxViewport, ComboboxVirtualizer } from '..'

const { startsWith } = useFilter({ sensitivity: 'base' })

const filterText = ref('')
const filteredOptions = computed(() => {
  const options = countryList.map(a => ({ label: a, value: a }))
  return filterText.value ? options.filter(opt => startsWith(opt.label, filterText.value)) : options
})
</script>

<template>
  <Story
    title="Combobox/Virtual"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant
      title="default"
      auto-props-disabled
    >
      <div class="flex justify-center">
        <ComboboxRoot
          name="test"
          multiple
        >
          <ComboboxAnchor class="w-[200px] relative inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
            <ComboboxInput
              v-model="filterText"
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
          <ComboboxContent class="absolute mt-2 p-[5px] w-[200px] bg-white rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
            <ComboboxViewport class="max-h-80 overflow-y-auto">
              <ComboboxVirtualizer
                v-slot="{ option }"
                :options="filteredOptions"
                :estimate-size="25"
                :text-content="(opt) => opt.label"
              >
                <ComboboxItem
                  class="text-[13px] w-full leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                  :value="option"
                >
                  <ComboboxItemIndicator
                    class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                  >
                    <Icon icon="radix-icons:check" />
                  </ComboboxItemIndicator>
                  <span class="truncate">
                    {{ option.label }}
                  </span>
                </ComboboxItem>
              </ComboboxVirtualizer>
            </ComboboxViewport>
          </ComboboxContent>
        </ComboboxRoot>
      </div>
    </Variant>
  </Story>
</template>
