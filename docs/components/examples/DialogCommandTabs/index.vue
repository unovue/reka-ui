<script setup lang="ts">
import type { CommandItem } from './list'
import { Icon } from '@iconify/vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxRoot, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger, VisuallyHidden } from 'reka-ui'
import { ref } from 'vue'
import { scopes } from './list'

const open = ref(false)
const scope = ref(scopes[0].value)
const chosen = ref('')

const { meta_k } = useMagicKeys()
whenever(meta_k, (pressed) => {
  if (pressed)
    open.value = true
})

/**
 * Tab cycles scopes without the input ever losing focus — the trigger elements
 * stay reachable for pointer and screen-reader users, but the palette's own
 * keyboard flow never leaves the search field.
 */
function cycleScope(step: number) {
  const index = scopes.findIndex(item => item.value === scope.value)
  scope.value = scopes[(index + step + scopes.length) % scopes.length].value
}

function select(event: Event, item: CommandItem) {
  event.preventDefault()
  chosen.value = item.name
  open.value = false
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <DialogRoot
      v-model:open="open"
      @update:open="$event && (scope = scopes[0].value)"
    >
      <DialogTrigger class="inline-flex items-center gap-4 rounded-lg border border-muted bg-card px-3 py-2 text-sm text-foreground">
        <span>Search everything</span>
        <kbd class="text-xs text-muted-foreground">⌘ K</kbd>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-30 bg-background/80" />
        <DialogContent class="fixed left-1/2 top-[15%] z-[100] w-[90vw] max-w-[26rem] -translate-x-1/2 overflow-hidden rounded-xl border border-muted bg-card text-sm focus:outline-none">
          <VisuallyHidden>
            <DialogTitle>Command menu</DialogTitle>
            <DialogDescription>Search pages, actions and people</DialogDescription>
          </VisuallyHidden>

          <ComboboxRoot :open="true">
            <ComboboxInput
              class="w-full bg-transparent px-4 py-3 outline-none placeholder:text-muted-foreground"
              placeholder="Search…"
              auto-focus
              @keydown.enter.prevent
              @keydown.tab.exact.prevent="cycleScope(1)"
              @keydown.shift.tab.prevent="cycleScope(-1)"
            />

            <TabsRoot v-model="scope">
              <TabsList class="relative flex gap-1 border-y border-muted px-2">
                <TabsIndicator class="absolute bottom-0 left-0 h-0.5 w-[--reka-tabs-indicator-size] translate-x-[--reka-tabs-indicator-position] rounded-full bg-primary transition-[width,transform] duration-300" />
                <TabsTrigger
                  v-for="item in scopes"
                  :key="item.value"
                  :value="item.value"
                  class="flex items-center gap-1.5 px-2 py-2 text-xs text-muted-foreground outline-none data-[state=active]:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {{ item.label }}
                  <span class="rounded bg-muted px-1 text-[10px] tabular-nums">{{ item.items.length }}</span>
                </TabsTrigger>
                <kbd class="ml-auto self-center text-[10px] text-muted-foreground">Tab</kbd>
              </TabsList>

              <ComboboxContent
                class="max-h-[16rem] overflow-y-auto p-2"
                @escape-key-down="open = false"
              >
                <ComboboxEmpty class="p-4 text-center text-muted-foreground">
                  Nothing found in this tab
                </ComboboxEmpty>

                <!-- Only the active panel is mounted, so the Combobox collection
                     holds exactly the items of the selected scope. -->
                <TabsContent
                  v-for="item in scopes"
                  :key="item.value"
                  :value="item.value"
                  class="outline-none"
                >
                  <ComboboxItem
                    v-for="entry in item.items"
                    :key="entry.id"
                    :value="entry.name"
                    class="flex cursor-default select-none items-center gap-3 rounded-md px-2 py-2 outline-none data-[highlighted]:bg-muted"
                    @select="select($event, entry)"
                  >
                    <Icon
                      :icon="entry.icon"
                      class="size-4 text-muted-foreground"
                    />
                    <span class="truncate">{{ entry.name }}</span>
                    <kbd
                      v-if="entry.hint"
                      class="ml-auto text-xs text-muted-foreground"
                    >{{ entry.hint }}</kbd>
                  </ComboboxItem>
                </TabsContent>
              </ComboboxContent>
            </TabsRoot>
          </ComboboxRoot>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <p class="text-xs text-muted-foreground">
      {{ chosen ? `Selected: ${chosen}` : 'Nothing selected yet.' }}
    </p>
  </div>
</template>
