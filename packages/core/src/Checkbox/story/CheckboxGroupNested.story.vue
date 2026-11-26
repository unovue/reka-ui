<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '..'

const groups = [
  { id: 'fruits', label: 'All fruits', items: ['Apple', 'Banana', 'Orange'] },
  { id: 'vegetables', label: 'All vegetables', items: ['Tomato', 'Carrot', 'Onion'] },
]
const selected = ref({ fruits: ['Banana'], vegetables: [] as string[] })
const disabledItems = ['Carrot']
</script>

<template>
  <Story
    title="Checkbox/Parent"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <h1 class="font-medium mb-6">
        What's your favorite food?
      </h1>
      <CheckboxGroupRoot
        v-for="group in groups"
        :key="group.id"
        v-model="selected[group.id as keyof typeof selected]"
        :all-values="group.items"
        :name="group.id"
        class="flex flex-col gap-2.5 pb-8"
      >
        <div class="flex flex-row gap-4 items-center">
          <CheckboxRoot
            :id="group.id"
            parent
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
          >
            <template #default="{ state }">
              <CheckboxIndicator class="bg-white h-full w-full rounded flex items-center justify-center">
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
            :for="group.id"
            class="select-none"
          >
            {{ group.label }}
          </label>
        </div>
        <div
          v-for="name in group.items"
          :key="name"
          class="flex flex-row gap-4 items-center pl-6"
        >
          <CheckboxRoot
            :id="`${group.id}-${name}`"
            :value="name"
            :disabled="disabledItems.includes(name)"
            class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black] data-[disabled]:opacity-50"
          >
            <CheckboxIndicator class="bg-white h-full w-full rounded flex items-center justify-center">
              <Icon
                icon="radix-icons:check"
                class="h-4 w-4 text-black"
              />
            </CheckboxIndicator>
          </CheckboxRoot>
          <label
            :for="`${group.id}-${name}`"
            class="select-none"
          >
            {{ name }}
          </label>
        </div>
      </CheckboxGroupRoot>
      <pre>{{ selected }}</pre>
    </Variant>
  </Story>
</template>
