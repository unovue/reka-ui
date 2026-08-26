<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useIntervalFn } from '@vueuse/core'
import { Label, PinInputInput, PinInputRoot } from 'reka-ui'
import { onMounted, ref } from 'vue'

/** The one code this demo accepts. A real app would ask the server. */
const VALID_CODE = '123456'
const RESEND_SECONDS = 30

type Status = 'idle' | 'verifying' | 'error' | 'success'

const code = ref<number[]>([])
const status = ref<Status>('idle')
const container = ref<HTMLElement>()

const secondsLeft = ref(0)
const { pause, resume } = useIntervalFn(() => {
  secondsLeft.value -= 1
  if (secondsLeft.value <= 0)
    pause()
}, 1000, { immediate: false })

function startCountdown() {
  secondsLeft.value = RESEND_SECONDS
  resume()
}

onMounted(startCountdown)

function resend() {
  code.value = []
  status.value = 'idle'
  startCountdown()
  container.value?.querySelector('input')?.focus()
}

// `@complete` fires once every slot is filled — including on paste, which is
// what makes auto-submit feel instant rather than requiring a button.
async function verify(value: number[]) {
  status.value = 'verifying'
  await new Promise(resolve => setTimeout(resolve, 900))

  if (value.join('') === VALID_CODE) {
    status.value = 'success'
    return
  }

  status.value = 'error'
  code.value = []
  container.value?.querySelector('input')?.focus()
}
</script>

<template>
  <div
    ref="container"
    class="flex w-[320px] flex-col items-center gap-4 rounded-xl border border-muted bg-card p-6 text-center"
  >
    <Icon
      icon="lucide:shield-check"
      class="size-7 text-muted-foreground"
    />
    <div>
      <Label
        for="otp"
        class="block text-sm font-medium text-foreground"
      >
        Verify your device
      </Label>
      <p class="mt-1 text-xs text-muted-foreground">
        Enter the 6-digit code we sent you. Try <code class="font-mono">123456</code>.
      </p>
    </div>

    <PinInputRoot
      id="otp"
      v-model="code"
      class="OtpRoot flex gap-2"
      :class="status === 'error' && 'OtpRoot--error'"
      :disabled="status === 'verifying' || status === 'success'"
      placeholder="○"
      type="number"
      otp
      @complete="verify"
    >
      <PinInputInput
        v-for="(id, index) in 6"
        :key="id"
        :index="index"
        class="size-10 rounded-lg border bg-background text-center text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        :class="status === 'error' ? 'border-destructive' : 'border-muted'"
      />
    </PinInputRoot>

    <p
      class="flex h-5 items-center gap-1.5 text-xs"
      role="status"
      aria-live="polite"
      :class="status === 'error' ? 'text-destructive' : status === 'success' ? 'text-grass11' : 'text-muted-foreground'"
    >
      <template v-if="status === 'verifying'">
        <Icon
          icon="lucide:loader-circle"
          class="size-3.5 animate-spin"
        />
        Verifying…
      </template>
      <template v-else-if="status === 'error'">
        <Icon
          icon="lucide:circle-alert"
          class="size-3.5"
        />
        That code was not right. Try again.
      </template>
      <template v-else-if="status === 'success'">
        <Icon
          icon="lucide:circle-check"
          class="size-3.5"
        />
        Device verified.
      </template>
    </p>

    <button
      type="button"
      class="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:no-underline disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
      :disabled="secondsLeft > 0"
      @click="resend"
    >
      {{ secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code' }}
    </button>
  </div>
</template>

<style scoped>
/* Re-triggering the shake on every failure needs the class to be added fresh,
   which is exactly what toggling `status` does. */
.OtpRoot--error {
  animation: otp-shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes otp-shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60% { transform: translateX(6px); }
}
</style>
