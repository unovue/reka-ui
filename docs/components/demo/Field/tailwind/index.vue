<script setup lang="ts">
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from 'reka-ui'
</script>

<template>
  <FieldRoot
    class="flex w-64 flex-col gap-1.5"
    name="email"
    validation-mode="onBlur"
  >
    <FieldLabel class="text-sm font-medium text-white">
      Email
    </FieldLabel>
    <FieldControl
      type="email"
      required
      placeholder="you@example.com"
      class="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 data-[invalid]:border-red-500"
    />
    <FieldDescription class="text-xs text-neutral-400">
      We'll never share your email.
    </FieldDescription>
    <FieldError
      match="valueMissing"
      class="text-xs text-red-500"
    >
      Email is required.
    </FieldError>
    <FieldError
      match="typeMismatch"
      class="text-xs text-red-500"
    >
      Please enter a valid email address.
    </FieldError>
  </FieldRoot>
</template>
