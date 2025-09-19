<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '..'

const items = [{ name: 'jack' }, { name: 'john' }, { name: 'mike' }]
const checkboxes = ref([items[1]])
</script>

<template>
  <Story
    title="Checkbox/Group"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <CheckboxGroupRoot
        v-model="checkboxes"
        name="test"
        class="flex flex-col gap-2.5"
      >
        <div
          v-for="item in items"
          :key="item.name"
          class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100"
        >
          <CheckboxRoot
            :id="item.name"
            :value="item"
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
            :for="item.name"
            class="select-none text-white"
          >
            {{ item.name }}
          </label>
        </div>
      </CheckboxGroupRoot>
    </Variant>
  </Story>
</template>
