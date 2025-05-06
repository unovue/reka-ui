<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { ref } from 'vue'

const checkboxOne = ref(true)
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <label class="flex flex-row gap-4 items-center [&>.checkbox]:hover:bg-neutral-100">
      <CheckboxRoot
        v-model="checkboxOne"
        class="hover:bg-stone-50 flex h-5 w-5 appearance-none items-center justify-center rounded-md bg-white shadow-sm border outline-none focus-within:shadow-[0_0_0_2px_black]"
      >
        <CheckboxIndicator class="bg-white h-full w-full rounded flex items-center justify-center">
          <Icon
            icon="radix-icons:check"
            class="h-5 w-5 text-grass9"
          />
        </CheckboxIndicator>
      </CheckboxRoot>
      <span class="select-none text-stone-700 text-sm dark:text-white">Accept terms and conditions.</span>
    </label>
  </div>
</template>
