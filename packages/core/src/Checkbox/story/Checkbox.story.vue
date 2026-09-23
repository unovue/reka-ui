<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from '..'

const checkboxOne = ref<boolean | 'indeterminate'>('indeterminate')
const checkboxThree = ref(false)
const customStringState = ref<'yes' | 'no'>('no')
const customNumberState = ref<1 | 0>(0)
</script>

<template>
  <Story
    title="Checkbox/Demo"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div class="flex flex-col gap-2.5">
        <label
          class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100"
        >
          <CheckboxRoot
            v-model="checkboxOne"
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
          >
            <CheckboxIndicator
              class="bg-white h-full w-full rounded flex items-center justify-center"
            >
              <Icon
                v-if="checkboxOne === 'indeterminate'"
                icon="radix-icons:divider-horizontal"
                class="h-4 w-4 text-black"
              />
              <Icon
                v-else-if="checkboxOne"
                icon="radix-icons:check"
                class="h-4 w-4 text-black"
              />
            </CheckboxIndicator>
          </CheckboxRoot>
          <span class="select-none">Checkbox</span>
        </label>
        <label
          class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100"
        >
          <CheckboxRoot
            disabled
            class="data-[disabled]:bg-mauve9 bg-white shadow h-6 aspect-square rounded flex items-center justify-center focus-within-within:outline focus-within-within:outline-2 focus-within-within:outline-[#00000066]"
          >
            <CheckboxIndicator
              class="bg-white h-full w-full rounded flex items-center justify-center"
            >
              <Icon
                icon="radix-icons:check"
                class="h-3 w-3 text-black"
              />
            </CheckboxIndicator>
          </CheckboxRoot>
          <span class="select-none">Disabled Checkbox</span>
        </label>
        <label
          class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100"
        >
          <CheckboxRoot
            v-model="checkboxThree"
            required
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
          >
            <CheckboxIndicator
              class="bg-white h-full w-full rounded flex items-center justify-center"
            >
              <Icon
                icon="radix-icons:check"
                class="h-3 w-3 text-black"
              />
            </CheckboxIndicator>
          </CheckboxRoot>
          <span class="select-none">Required Checkbox</span>
        </label>
      </div>
    </Variant>

    <Variant title="Custom string values">
      <div class="flex flex-col gap-4">
        <label
          class="flex flex-row gap-4 items-center"
        >
          <CheckboxRoot
            v-model="customStringState"
            true-value="yes"
            false-value="no"
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
          >
            <CheckboxIndicator
              class="bg-white h-full w-full rounded flex items-center justify-center"
            >
              <Icon
                icon="radix-icons:check"
                class="h-4 w-4 text-black"
              />
            </CheckboxIndicator>
          </CheckboxRoot>
          <span class="select-none">Accept terms</span>
        </label>
        <span class="text-sm">v-model value: "{{ customStringState }}"</span>
      </div>
    </Variant>

    <Variant title="Custom number values">
      <div class="flex flex-col gap-4">
        <label
          class="flex flex-row gap-4 items-center"
        >
          <CheckboxRoot
            v-model="customNumberState"
            :true-value="1"
            :false-value="0"
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
          >
            <CheckboxIndicator
              class="bg-white h-full w-full rounded flex items-center justify-center"
            >
              <Icon
                icon="radix-icons:check"
                class="h-4 w-4 text-black"
              />
            </CheckboxIndicator>
          </CheckboxRoot>
          <span class="select-none">Enable feature</span>
        </label>
        <span class="text-sm">v-model value: {{ customNumberState }}</span>
      </div>
    </Variant>
  </Story>
</template>
