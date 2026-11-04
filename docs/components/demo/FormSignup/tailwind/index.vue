<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  CheckboxIndicator,
  CheckboxRoot,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FormRoot,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { ref } from 'vue'

const plans = [
  { value: 'hobby', label: 'Hobby' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
]

const serverErrors = ref<Record<string, string>>({})
const submitted = ref<Record<string, unknown>>()

// `formSubmit` only fires once every field is valid. It receives the value of
// every named field, whatever control renders it.
function onFormSubmit(values: Record<string, unknown>) {
  submitted.value = undefined
  // Pretend the server rejected the address.
  if (values.email === 'taken@example.com') {
    serverErrors.value = { email: 'An account with this email already exists.' }
    return
  }
  serverErrors.value = {}
  submitted.value = values
}

const labelClass = 'text-sm font-medium text-foreground'
const errorClass = 'text-xs text-red-500'
</script>

<template>
  <FormRoot
    class="flex w-72 flex-col gap-4"
    :errors="serverErrors"
    @form-submit="onFormSubmit"
  >
    <FieldRoot
      name="email"
      required
      class="flex flex-col gap-1.5"
    >
      <FieldLabel :class="labelClass">
        Email
      </FieldLabel>
      <FieldControl
        type="email"
        placeholder="you@example.com"
        class="h-9 rounded-lg border border-muted bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 data-[invalid]:border-red-500"
      />
      <FieldDescription class="text-xs text-muted-foreground">
        Try taken@example.com for a server error.
      </FieldDescription>
      <FieldError :class="errorClass" />
    </FieldRoot>

    <!-- A Select inside a Field takes the field's name, id, label and `required`. -->
    <FieldRoot
      name="plan"
      required
      class="flex flex-col gap-1.5"
    >
      <FieldLabel :class="labelClass">
        Plan
      </FieldLabel>
      <SelectRoot>
        <SelectTrigger class="inline-flex h-9 items-center justify-between rounded-lg border border-muted bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 data-[placeholder]:text-muted-foreground data-[invalid]:border-red-500">
          <SelectValue placeholder="Choose a plan" />
          <Icon
            icon="radix-icons:chevron-down"
            class="h-4 w-4"
          />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            position="popper"
            :side-offset="4"
            class="z-[100] w-[var(--reka-select-trigger-width)] rounded-lg border border-muted bg-card shadow-sm"
          >
            <SelectViewport class="p-1">
              <SelectItem
                v-for="plan in plans"
                :key="plan.value"
                :value="plan.value"
                class="relative flex h-8 select-none items-center rounded-md pl-7 pr-2 text-sm text-foreground outline-none data-[highlighted]:bg-muted"
              >
                <SelectItemIndicator class="absolute left-2 inline-flex items-center">
                  <Icon
                    icon="radix-icons:check"
                    class="h-4 w-4"
                  />
                </SelectItemIndicator>
                <SelectItemText>{{ plan.label }}</SelectItemText>
              </SelectItem>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
      <FieldError
        match="valueMissing"
        :class="errorClass"
      >
        Pick a plan to continue.
      </FieldError>
    </FieldRoot>

    <!-- A required Checkbox is missing until it is checked. -->
    <FieldRoot
      name="terms"
      required
      class="flex flex-col gap-1.5"
    >
      <div class="flex items-center gap-2">
        <CheckboxRoot class="flex h-5 w-5 items-center justify-center rounded-md border border-muted bg-card outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[invalid]:border-red-500">
          <CheckboxIndicator>
            <Icon
              icon="radix-icons:check"
              class="h-4 w-4 text-foreground"
            />
          </CheckboxIndicator>
        </CheckboxRoot>
        <FieldLabel :class="labelClass">
          I accept the terms
        </FieldLabel>
      </div>
      <FieldError
        match="valueMissing"
        :class="errorClass"
      >
        You must accept the terms.
      </FieldError>
    </FieldRoot>

    <button
      type="submit"
      class="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      Create account
    </button>

    <pre
      v-if="submitted"
      data-testid="submitted"
      class="rounded-lg bg-muted p-2 text-xs text-foreground"
    >{{ JSON.stringify(submitted) }}</pre>
  </FormRoot>
</template>
