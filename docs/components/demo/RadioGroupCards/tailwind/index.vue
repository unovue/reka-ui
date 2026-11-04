<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { ref } from 'vue'

const plans = [
  { value: 'starter', name: 'Starter', description: '1 project, community support', price: '$0' },
  { value: 'pro', name: 'Pro', description: 'Unlimited projects, email support', price: '$12' },
  { value: 'enterprise', name: 'Enterprise', description: 'SSO and a dedicated contact', price: 'Talk to us', disabled: true },
]

const plan = ref('pro')
</script>

<template>
  <div class="flex w-72 flex-col gap-2">
    <span
      id="plan-label"
      class="text-sm font-medium text-foreground"
    >Plan</span>

    <!-- With `name`, a hidden native radio is submitted with the surrounding form. -->
    <RadioGroupRoot
      v-model="plan"
      name="plan"
      aria-labelledby="plan-label"
      class="flex flex-col gap-2"
    >
      <!-- The whole card is the radio: its text becomes the accessible name. -->
      <RadioGroupItem
        v-for="option in plans"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        class="flex w-full items-center gap-3 rounded-lg border border-muted bg-card px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=checked]:border-primary data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium text-foreground">{{ option.name }}</span>
          <span class="block text-xs text-muted-foreground">{{ option.description }}</span>
        </span>
        <span class="text-sm tabular-nums text-foreground">{{ option.price }}</span>
        <RadioGroupIndicator class="text-primary">
          <Icon
            icon="radix-icons:check-circled"
            class="h-4 w-4"
          />
        </RadioGroupIndicator>
      </RadioGroupItem>
    </RadioGroupRoot>

    <p
      class="text-xs text-muted-foreground"
      data-testid="plan"
    >
      Selected: {{ plan }}
    </p>
  </div>
</template>
