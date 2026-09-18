<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '..'

const fruits = ['Apple', 'Banana', 'Orange']
const vegetables = ['Tomato', 'Carrot', 'Onion']
const selected = ref(['Banana'])
</script>

<template>
  <Story
    title="Checkbox/Nested Group"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <h1 class="font-medium mb-6">
        What's your favorite food?
      </h1>
      <CheckboxGroupRoot
        v-model="selected"
        name="test"
        class="flex flex-col gap-2.5"
      >
        <div class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100">
          <CheckboxRoot
            id="fruits"
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
            parent
          >
            <template #default="{ state }">
              <CheckboxIndicator
                class="bg-white h-full w-full rounded flex items-center justify-center"
              >
                <Icon
                  v-if="state === 'indeterminate'"
                  icon="radix-icons:divider-horizontal"
                  class="h-4 w-4 text-black"
                />
                <Icon
                  v-else-if="state"
                  icon="radix-icons:check"
                  class="h-4 w-4 text-black"
                />
              </CheckboxIndicator>
            </template>
          </CheckboxRoot>
          <label
            for="fruits"
            class="select-none"
          >
            All fruits
          </label>
        </div>
        <div
          v-for="name in fruits"
          :key="name"
          class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100"
        >
          <CheckboxRoot
            :id="name"
            :value="name"
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
          <label
            :for="name"
            class="select-none"
          >
            {{ name }}
          </label>
        </div>
      </CheckboxGroupRoot>

      <CheckboxGroupRoot
        v-model="selected"
        name="test"
        class="flex flex-col gap-2.5 pt-8"
      >
        <div class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100">
          <CheckboxRoot
            id="fruits"
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
            parent
          >
            <template #default="{ state }">
              <CheckboxIndicator
                class="bg-white h-full w-full rounded flex items-center justify-center"
              >
                <Icon
                  v-if="state === 'indeterminate'"
                  icon="radix-icons:divider-horizontal"
                  class="h-4 w-4 text-black"
                />
                <Icon
                  v-else-if="state"
                  icon="radix-icons:check"
                  class="h-4 w-4 text-black"
                />
              </CheckboxIndicator>
            </template>
          </CheckboxRoot>
          <label
            for="vegetables"
            class="select-none"
          >
            All vegetables
          </label>
        </div>
        <div
          v-for="name in vegetables"
          :key="name"
          class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100"
        >
          <CheckboxRoot
            :id="name"
            :value="name"
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
          <label
            :for="name"
            class="select-none"
          >
            {{ name }}
          </label>
        </div>
      </CheckboxGroupRoot>
    </Variant>
  </Story>
</template>
