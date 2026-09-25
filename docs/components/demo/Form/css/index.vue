<script setup lang="ts">
import { FieldControl, FieldError, FieldLabel, FieldRoot, FormRoot } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

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
    class="FormRoot"
    :errors="serverErrors"
    @submit="onSubmit"
  >
    <FieldRoot
      class="FieldRoot"
      name="username"
      required
      validation-mode="onBlur"
    >
      <FieldLabel class="FieldLabel">
        Username
      </FieldLabel>
      <FieldControl
        placeholder="Try 'taken'"
        class="FieldControl"
      />
      <FieldError
        match="valueMissing"
        class="FieldError"
      >
        Username is required.
      </FieldError>
      <FieldError
        v-slot="{ errors }"
        class="FieldError"
      >
        {{ errors[0] }}
      </FieldError>
    </FieldRoot>

    <button
      type="submit"
      class="SubmitButton"
    >
      Submit
    </button>

    <p
      v-if="submittedUsername"
      class="SuccessMessage"
    >
      Submitted as "{{ submittedUsername }}".
    </p>
  </FormRoot>
</template>
