<script setup lang="ts">
import type { WizardForm } from './schema'
import { Icon } from '@iconify/vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, StepperIndicator, StepperItem, StepperRoot, StepperSeparator, StepperTitle, StepperTrigger } from 'reka-ui'
import { computed, reactive, ref } from 'vue'
import { validators } from './schema'

const steps = [
  { step: 1, title: 'Account' },
  { step: 2, title: 'Profile' },
  { step: 3, title: 'Review' },
]

const open = ref(false)
const currentStep = ref(1)
const submitted = ref(false)
// Errors only surface once the user has tried to move on, so a pristine form
// does not greet them in red.
const showErrors = ref(false)

const form = reactive<WizardForm>({ email: '', password: '', name: '', username: '' })

const errors = computed(() => validators[currentStep.value](form))

function isStepComplete(step: number) {
  return Object.keys(validators[step](form)).length === 0
}

/** A step is reachable only once every step before it validates. */
function canReach(step: number) {
  return steps.slice(0, step - 1).every(item => isStepComplete(item.step))
}

function goNext(nextStep: () => void) {
  if (Object.keys(errors.value).length) {
    showErrors.value = true
    return
  }
  showErrors.value = false
  nextStep()
}

function goPrev(prevStep: () => void) {
  showErrors.value = false
  prevStep()
}

function reset() {
  Object.assign(form, { email: '', password: '', name: '', username: '' })
  currentStep.value = 1
  showErrors.value = false
  submitted.value = false
}

const fieldClass = 'h-9 w-full rounded-lg border border-muted bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40'
</script>

<template>
  <DialogRoot
    v-model:open="open"
    @update:open="$event && reset()"
  >
    <DialogTrigger class="inline-flex h-9 items-center rounded-lg border border-muted bg-card px-4 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40">
      Create account
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-30 bg-background/80 data-[state=open]:animate-overlayShow" />
      <DialogContent class="fixed left-1/2 top-1/2 z-[100] w-[90vw] max-w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-muted bg-card p-6 focus:outline-none data-[state=open]:animate-contentShow">
        <DialogTitle class="text-base font-semibold text-foreground">
          Create account
        </DialogTitle>
        <DialogDescription class="mt-1 text-sm text-muted-foreground">
          Three short steps. You can go back at any point.
        </DialogDescription>

        <div
          v-if="submitted"
          class="mt-6 flex flex-col items-center gap-3 py-8 text-center"
        >
          <Icon
            icon="lucide:circle-check"
            class="size-8 text-primary"
          />
          <p class="text-sm text-foreground">
            Welcome, {{ form.name }}.
          </p>
          <DialogClose class="mt-2 inline-flex h-9 items-center rounded-lg border border-muted px-4 text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40">
            Done
          </DialogClose>
        </div>

        <StepperRoot
          v-else
          v-slot="{ nextStep, prevStep, isFirstStep, isLastStep }"
          v-model="currentStep"
          class="mt-6"
          linear
        >
          <div class="flex w-full">
            <StepperItem
              v-for="item in steps"
              :key="item.step"
              v-slot="{ state }"
              class="group relative flex flex-1 flex-col items-center gap-2"
              :step="item.step"
              :disabled="!canReach(item.step)"
            >
              <StepperTrigger class="z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-muted bg-card text-xs font-semibold text-muted-foreground group-data-[state=active]:border-primary group-data-[state=active]:text-primary group-data-[state=completed]:border-primary group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40">
                <StepperIndicator>
                  <Icon
                    v-if="state === 'completed'"
                    icon="lucide:check"
                    class="size-4"
                  />
                  <template v-else>
                    {{ item.step }}
                  </template>
                </StepperIndicator>
              </StepperTrigger>

              <StepperSeparator
                v-if="item.step !== steps.length"
                class="absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-4 h-0.5 rounded-full bg-muted group-data-[state=completed]:bg-primary"
              />

              <StepperTitle class="text-xs text-muted-foreground group-data-[state=active]:font-semibold group-data-[state=active]:text-foreground">
                {{ item.title }}
              </StepperTitle>
            </StepperItem>
          </div>

          <form
            class="mt-6 flex min-h-[9.5rem] flex-col gap-3"
            @submit.prevent="isLastStep ? (submitted = true) : goNext(nextStep)"
          >
            <template v-if="currentStep === 1">
              <label class="flex flex-col gap-1.5 text-sm">
                <span class="font-medium text-foreground">Email</span>
                <input
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  :class="fieldClass"
                >
                <span
                  v-if="showErrors && errors.email"
                  class="text-xs text-destructive"
                >{{ errors.email }}</span>
              </label>
              <label class="flex flex-col gap-1.5 text-sm">
                <span class="font-medium text-foreground">Password</span>
                <input
                  v-model="form.password"
                  type="password"
                  autocomplete="new-password"
                  :class="fieldClass"
                >
                <span
                  v-if="showErrors && errors.password"
                  class="text-xs text-destructive"
                >{{ errors.password }}</span>
              </label>
            </template>

            <template v-else-if="currentStep === 2">
              <label class="flex flex-col gap-1.5 text-sm">
                <span class="font-medium text-foreground">Full name</span>
                <input
                  v-model="form.name"
                  autocomplete="name"
                  :class="fieldClass"
                >
                <span
                  v-if="showErrors && errors.name"
                  class="text-xs text-destructive"
                >{{ errors.name }}</span>
              </label>
              <label class="flex flex-col gap-1.5 text-sm">
                <span class="font-medium text-foreground">Username</span>
                <input
                  v-model="form.username"
                  autocomplete="username"
                  :class="fieldClass"
                >
                <span
                  v-if="showErrors && errors.username"
                  class="text-xs text-destructive"
                >{{ errors.username }}</span>
              </label>
            </template>

            <dl
              v-else
              class="grid grid-cols-[7rem_1fr] gap-y-2 text-sm"
            >
              <dt class="text-muted-foreground">
                Email
              </dt>
              <dd class="truncate text-foreground">
                {{ form.email }}
              </dd>
              <dt class="text-muted-foreground">
                Name
              </dt>
              <dd class="truncate text-foreground">
                {{ form.name }}
              </dd>
              <dt class="text-muted-foreground">
                Username
              </dt>
              <dd class="truncate text-foreground">
                {{ form.username }}
              </dd>
            </dl>

            <div class="mt-auto flex items-center justify-between pt-4">
              <button
                type="button"
                class="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground disabled:invisible focus:outline-none focus:ring-2 focus:ring-primary/40"
                :disabled="isFirstStep"
                @click="goPrev(prevStep)"
              >
                Back
              </button>
              <button
                type="submit"
                class="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {{ isLastStep ? 'Create account' : 'Next' }}
              </button>
            </div>
          </form>
        </StepperRoot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
