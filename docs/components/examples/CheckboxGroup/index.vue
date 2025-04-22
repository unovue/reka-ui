<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { ref } from 'vue'

const values = ref([])

const items = [
  { label: 'Soccer', value: 'soccer' },
  { label: 'Badminton', value: 'badminton' },
  { label: 'Basketball', value: 'basketball' },
]
</script>

<template>
  <CheckboxGroupRoot
    v-model="values"
    class="flex flex-col gap-2.5"
  >
    <div
      v-for="item in items"
      :key="item.value"
      class="flex items-center gap-3"
    >
      <CheckboxRoot
        :value="item.value"
        class="shadow-blackA7 hover:bg-green3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-md bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
      >
        <CheckboxIndicator class="bg-white h-full w-full rounded flex items-center justify-center">
          <Icon
            icon="radix-icons:check"
            class="h-3.5 w-3.5 text-grass11"
          />
        </CheckboxIndicator>
      </CheckboxRoot>
      <label class="flex flex-row gap-4 items-center">
        <span class="select-none dark:text-white">{{ item.label }}</span>
      </label>
    </div>
  </CheckboxGroupRoot>
</template>
