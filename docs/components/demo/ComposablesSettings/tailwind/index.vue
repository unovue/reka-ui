<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useCollapsible, useSwitch } from 'reka-ui'
import { ref } from 'vue'

// Uncontrolled: the composable keeps the state, `defaultOpen` seeds it.
const panel = useCollapsible({ baseId: 'notification-settings', defaultOpen: true })

// Ref-owned: pass a writable ref and the composable writes changes back to it.
const productUpdates = ref(true)
const productUpdatesSwitch = useSwitch({ modelValue: productUpdates })

const locked = ref(false)
const lockSwitch = useSwitch({ modelValue: locked })

// `onBeforeUpdate` sees every change first; `details.cancel()` keeps the current value.
const marketingSwitch = useSwitch({
  defaultValue: false,
  onBeforeUpdate: (_value, details) => {
    if (locked.value)
      details.cancel()
  },
})

const rows = [
  { id: 'product-updates', label: 'Product updates', api: productUpdatesSwitch },
  { id: 'marketing', label: 'Marketing emails', api: marketingSwitch },
  { id: 'lock', label: 'Lock preferences', api: lockSwitch },
]
</script>

<template>
  <div class="w-[300px] rounded-lg border bg-white shadow-sm dark:bg-stone-900 dark:border-stone-700">
    <div v-bind="panel.root.attrs.value">
      <button
        type="button"
        class="group flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-stone-700 outline-none focus-visible:ring-2 focus-visible:ring-stone-800 rounded-lg dark:text-white"
        v-bind="panel.trigger.attrs.value"
      >
        Email notifications
        <Icon
          icon="radix-icons:chevron-down"
          class="h-4 w-4 transition-transform group-data-[state=open]:-rotate-180"
        />
      </button>

      <div v-bind="panel.content.attrs.value">
        <div class="space-y-3 border-t px-4 py-3 dark:border-stone-700">
          <div
            v-for="row in rows"
            :key="row.id"
            class="flex items-center justify-between gap-4"
          >
            <span
              :id="`${row.id}-label`"
              class="text-sm text-stone-700 dark:text-white"
            >{{ row.label }}</span>
            <button
              type="button"
              :aria-labelledby="`${row.id}-label`"
              class="relative flex h-[20px] w-[32px] shrink-0 rounded-full border border-stone-300 shadow-sm transition-[background] data-[state=checked]:border-stone-700 data-[state=checked]:bg-stone-800 data-[state=unchecked]:bg-stone-300 outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-stone-800 dark:border-stone-700 dark:data-[state=unchecked]:bg-stone-800 dark:data-[state=checked]:bg-stone-600"
              v-bind="row.api.root.attrs.value"
            >
              <span
                class="my-auto h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white shadow-xl transition-transform will-change-transform data-[state=checked]:translate-x-full"
                v-bind="row.api.thumb.attrs.value"
              />
            </button>
          </div>

          <p
            class="text-xs text-stone-500 dark:text-stone-400"
            data-testid="marketing-details"
          >
            Marketing: last change
            <code>{{ marketingSwitch.lastChangeDetails.value.reason }}</code>
            <template v-if="marketingSwitch.lastChangeDetails.value.isCanceled">
              (cancelled, preferences are locked)
            </template>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
