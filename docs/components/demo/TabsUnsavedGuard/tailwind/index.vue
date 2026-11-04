<script setup lang="ts">
import type { ChangeEventDetails, TabsChangeReason } from 'reka-ui'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, ref } from 'vue'

const tab = ref('profile')

const savedName = ref('Pedro Duarte')
const name = ref(savedName.value)
const isDirty = computed(() => name.value !== savedName.value)
const blocked = ref(false)

// Runs before the tab changes, for a click, an arrow key or focus alike.
// Cancelling keeps the current tab selected and focus where it was.
function guardUnsaved(_value: string | number | undefined, details: ChangeEventDetails<TabsChangeReason>) {
  blocked.value = isDirty.value
  if (isDirty.value)
    details.cancel()
}

function save() {
  savedName.value = name.value
  blocked.value = false
}

function discard() {
  name.value = savedName.value
  blocked.value = false
}

const triggerClass = 'flex h-10 flex-1 items-center justify-center px-4 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 data-[state=checked]:text-foreground data-[state=checked]:shadow-[inset_0_-2px_0_0] data-[state=checked]:shadow-primary'
const buttonClass = 'h-8 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50'
</script>

<template>
  <TabsRoot
    v-model="tab"
    class="w-full rounded-lg border border-muted bg-card sm:w-[320px]"
    @before-update:model-value="guardUnsaved"
  >
    <TabsList
      class="flex border-b border-muted"
      aria-label="Settings"
    >
      <TabsTrigger
        value="profile"
        :class="triggerClass"
      >
        Profile
      </TabsTrigger>
      <TabsTrigger
        value="notifications"
        :class="triggerClass"
      >
        Notifications
      </TabsTrigger>
    </TabsList>

    <TabsContent
      value="profile"
      class="flex flex-col gap-3 p-4 outline-none"
    >
      <label class="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        Display name
        <input
          v-model="name"
          class="h-9 rounded-lg border border-muted bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/40"
        >
      </label>
      <p
        v-if="blocked"
        role="alert"
        class="text-xs text-red-500"
      >
        Save or discard your changes before switching tabs.
      </p>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="border border-muted text-foreground hover:bg-muted"
          :class="[buttonClass]"
          :disabled="!isDirty"
          @click="discard"
        >
          Discard
        </button>
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:opacity-90"
          :class="[buttonClass]"
          :disabled="!isDirty"
          @click="save"
        >
          Save
        </button>
      </div>
    </TabsContent>

    <TabsContent
      value="notifications"
      class="p-4 text-sm text-muted-foreground outline-none"
    >
      Your name is shown as “{{ savedName }}” in notification emails.
    </TabsContent>
  </TabsRoot>
</template>
