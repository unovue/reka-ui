<script setup lang="ts">
import { FieldControl, FieldError, FieldLabel, FieldRoot, FormRoot } from 'reka-ui'
import { ref } from 'vue'

const serverErrors = ref<Record<string, string>>({})
const submittedUsername = ref('')

function onSubmit(event: Event) {
  submittedUsername.value = ''
  const formData = new FormData(event.target as HTMLFormElement)
  const username = formData.get('username')

  // Pretend this came back from an API call.
  if (username === 'taken') {
    serverErrors.value = { username: 'That username is already taken.' }
  }
  else {
    serverErrors.value = {}
    submittedUsername.value = String(username)
  }
}
</script>

<template>
  <FormRoot
    class="flex w-64 flex-col gap-3"
    :errors="serverErrors"
    @submit="onSubmit"
  >
    <FieldRoot
      class="flex flex-col gap-1.5"
      name="username"
      required
      validation-mode="onBlur"
    >
      <FieldLabel class="text-sm font-medium text-white">
        Username
      </FieldLabel>
      <FieldControl
        placeholder="Try 'taken'"
        class="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 data-[invalid]:border-red-500"
      />
      <FieldError
        match="valueMissing"
        class="text-xs text-red-500"
      >
        Username is required.
      </FieldError>
      <FieldError
        v-slot="{ errors }"
        class="text-xs text-red-500"
      >
        {{ errors[0] }}
      </FieldError>
    </FieldRoot>

    <button
      type="submit"
      class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
    >
      Submit
    </button>

    <p
      v-if="submittedUsername"
      class="text-xs text-emerald-500"
    >
      Submitted as "{{ submittedUsername }}".
    </p>
  </FormRoot>
</template>
