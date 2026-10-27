<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { countryList } from '@/shared/constant'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SelectVirtualizer,
} from '..'

const country = ref<string>()
const countries = ref<string[]>([])

const byLetter = new Map<string, string[]>()
for (const name of countryList)
  byLetter.set(name[0].toUpperCase(), [...(byLetter.get(name[0].toUpperCase()) ?? []), name])
const groupedCountries = Array.from(byLetter, ([letter, names]) => ({ label: letter, options: names }))

const triggerClass = 'min-w-[200px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-violet11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 outline-none'
const contentClass = 'w-[--reka-select-trigger-width] max-h-[--reka-select-content-available-height] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]'
const itemClass = 'text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] w-full pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1'
</script>

<template>
  <Story
    title="Select/Virtual"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Single">
      <SelectRoot v-model="country">
        <SelectTrigger
          :class="triggerClass"
          aria-label="Country"
        >
          <SelectValue placeholder="Pick a country" />
          <Icon
            icon="radix-icons:chevron-down"
            class="h-4 w-4"
          />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            :class="contentClass"
            position="popper"
            :side-offset="5"
          >
            <SelectScrollUpButton class="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
              <Icon icon="radix-icons:chevron-up" />
            </SelectScrollUpButton>
            <SelectViewport class="p-[5px] max-h-72">
              <SelectVirtualizer
                v-slot="{ option }"
                :options="countryList"
                :estimate-size="25"
              >
                <SelectItem
                  :value="option"
                  :class="itemClass"
                >
                  <SelectItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                    <Icon icon="radix-icons:check" />
                  </SelectItemIndicator>
                  <SelectItemText>{{ option }}</SelectItemText>
                </SelectItem>
              </SelectVirtualizer>
            </SelectViewport>
            <SelectScrollDownButton class="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
              <Icon icon="radix-icons:chevron-down" />
            </SelectScrollDownButton>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </Variant>

    <Variant title="Grouped, multiple">
      <SelectRoot
        v-model="countries"
        multiple
      >
        <SelectTrigger
          :class="triggerClass"
          aria-label="Countries"
        >
          <SelectValue placeholder="Pick countries" />
          <Icon
            icon="radix-icons:chevron-down"
            class="h-4 w-4"
          />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            :class="contentClass"
            position="popper"
            :side-offset="5"
          >
            <SelectViewport class="p-[5px] max-h-72">
              <SelectVirtualizer
                :options="groupedCountries"
                :estimate-size="25"
              >
                <template #group="{ group }">
                  <div class="px-[25px] h-[25px] flex items-center text-xs leading-[25px] text-mauve11">
                    {{ group.label }}
                  </div>
                </template>
                <template #default="{ option }">
                  <SelectItem
                    :value="option"
                    :class="itemClass"
                  >
                    <SelectItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                      <Icon icon="radix-icons:check" />
                    </SelectItemIndicator>
                    <SelectItemText>{{ option }}</SelectItemText>
                  </SelectItem>
                </template>
              </SelectVirtualizer>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </Variant>
  </Story>
</template>
