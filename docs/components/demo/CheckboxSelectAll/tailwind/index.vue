<script setup lang="ts">
import type { CheckboxCheckedState } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, ref } from 'vue'

const toppings = [
  { value: 'cheese', label: 'Extra cheese' },
  { value: 'mushrooms', label: 'Mushrooms' },
  { value: 'olives', label: 'Olives' },
  { value: 'peppers', label: 'Peppers' },
]

const selected = ref<string[]>(['cheese'])

// The parent derives its state from the group: none, all, or some ("indeterminate").
// Pressing an indeterminate checkbox checks it, which selects every topping.
const allSelected = computed<CheckboxCheckedState>({
  get: () => selected.value.length === 0
    ? false
    : selected.value.length === toppings.length ? true : 'indeterminate',
  set: value => selected.value = value === true ? toppings.map(topping => topping.value) : [],
})

const boxClass = 'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-muted bg-card outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary'
</script>

<template>
  <div class="flex w-56 flex-col gap-3">
    <label class="flex items-center gap-3 border-b border-muted pb-3 text-sm font-medium text-foreground">
      <CheckboxRoot
        v-model="allSelected"
        :class="boxClass"
      >
        <CheckboxIndicator class="text-primary-foreground">
          <Icon
            :icon="allSelected === 'indeterminate' ? 'radix-icons:minus' : 'radix-icons:check'"
            class="h-4 w-4"
          />
        </CheckboxIndicator>
      </CheckboxRoot>
      All toppings
    </label>

    <CheckboxGroupRoot
      v-model="selected"
      class="flex flex-col gap-2.5 pl-3"
    >
      <label
        v-for="topping in toppings"
        :key="topping.value"
        class="flex items-center gap-3 text-sm text-foreground"
      >
        <CheckboxRoot
          :value="topping.value"
          :class="boxClass"
        >
          <CheckboxIndicator class="text-primary-foreground">
            <Icon
              icon="radix-icons:check"
              class="h-4 w-4"
            />
          </CheckboxIndicator>
        </CheckboxRoot>
        {{ topping.label }}
      </label>
    </CheckboxGroupRoot>

    <p
      class="text-xs text-muted-foreground"
      data-testid="selected"
    >
      {{ selected.length }} of {{ toppings.length }} selected
    </p>
  </div>
</template>
