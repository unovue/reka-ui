<script setup lang="ts">
import type { ChangeEventDetails, SwitchChangeReason } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

// Stand-in for `fetch('/api/profile', { method: 'PATCH', … })`.
function saveVisibility(isPublic: boolean): Promise<boolean> {
  return new Promise(resolve => setTimeout(resolve, 400, isPublic))
}

const isPublic = ref(false)
const saving = ref(false)

// Keep the switch where it is until the server has accepted the change:
// cancel the press, save, then apply what the server returned.
async function confirmWithServer(value: boolean, details: ChangeEventDetails<SwitchChangeReason>) {
  details.cancel()
  if (saving.value)
    return
  saving.value = true
  try {
    isPublic.value = await saveVisibility(value)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <label
      for="public-profile"
      class="select-none text-sm text-foreground"
    >
      Public profile
    </label>
    <SwitchRoot
      id="public-profile"
      v-model="isPublic"
      :aria-busy="saving"
      class="relative flex h-[20px] w-[32px] shrink-0 rounded-full border border-stone-300 shadow-sm transition-[background] data-[state=checked]:border-stone-700 data-[state=checked]:bg-stone-800 data-[state=unchecked]:bg-stone-300 outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-stone-800 aria-busy:opacity-60 dark:border-stone-700 dark:data-[state=unchecked]:bg-stone-800 dark:data-[state=checked]:bg-stone-600"
      @before-update:model-value="confirmWithServer"
    >
      <SwitchThumb class="my-auto h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white shadow-xl transition-transform will-change-transform data-[state=checked]:translate-x-full" />
    </SwitchRoot>
    <Icon
      v-if="saving"
      icon="lucide:loader-circle"
      class="h-4 w-4 animate-spin text-muted-foreground"
      aria-hidden="true"
    />
    <span
      class="text-xs text-muted-foreground"
      data-testid="status"
    >{{ saving ? 'Saving…' : isPublic ? 'Visible to everyone' : 'Only you' }}</span>
  </div>
</template>
