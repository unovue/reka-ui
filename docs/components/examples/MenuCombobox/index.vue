<script setup lang="ts">
import type { Entry } from './data'
import { Icon } from '@iconify/vue'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from 'reka-ui'
import { computed, ref } from 'vue'
import { filterEntries, labels, projects } from './data'

const projectQuery = ref('')
const labelQuery = ref('')
const project = ref('Design System')
const label = ref('Feature')

const filteredProjects = computed(() => filterEntries(projects, projectQuery.value))
const filteredLabels = computed(() => filterEntries(labels, labelQuery.value))

const projectInput = ref<HTMLInputElement>()
const labelInput = ref<HTMLInputElement>()

/**
 * MenuContent focuses its first item on open. Hand that to the search field
 * instead, so typing filters rather than triggering the menu's typeahead.
 */
function focusInput(event: Event, input?: HTMLInputElement) {
  event.preventDefault()
  requestAnimationFrame(() => input?.focus())
}

/**
 * MenuContent only handles Home/End/Arrow keys when they land on the content
 * itself, so from inside the input the first item has to be focused by hand.
 */
function focusFirstItem(event: KeyboardEvent) {
  const content = (event.currentTarget as HTMLElement).closest('[role="menu"]')
  content?.querySelector<HTMLElement>('[role="menuitem"]:not([data-disabled])')?.focus()
}

function choose(entry: Entry, target: 'project' | 'label') {
  if (target === 'project')
    project.value = entry.name
  else
    label.value = entry.name
}

const inputClass = 'w-full bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground'
const itemClass = 'flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none data-[highlighted]:bg-muted'
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <DropdownMenuRoot @update:open="!$event && (projectQuery = '', labelQuery = '')">
      <DropdownMenuTrigger class="inline-flex h-9 items-center gap-2 rounded-lg border border-muted bg-card px-3 text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40">
        <Icon
          icon="lucide:corner-up-right"
          class="size-4 text-muted-foreground"
        />
        Move issue
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          class="z-[100] w-[16rem] overflow-hidden rounded-lg border border-muted bg-card p-1 shadow-lg data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade"
          :side-offset="6"
          align="start"
          @open-auto-focus="focusInput($event, projectInput)"
        >
          <div class="mb-1 flex items-center gap-1 border-b border-muted px-1">
            <Icon
              icon="lucide:search"
              class="size-3.5 shrink-0 text-muted-foreground"
            />
            <input
              ref="projectInput"
              v-model="projectQuery"
              :class="inputClass"
              placeholder="Move to project…"
              @keydown.down.prevent="focusFirstItem"
            >
          </div>

          <div class="max-h-[13rem] overflow-y-auto">
            <DropdownMenuItem
              v-for="entry in filteredProjects"
              :key="entry.name"
              :class="itemClass"
              @select="choose(entry, 'project')"
            >
              <Icon
                :icon="entry.icon"
                class="size-4 text-muted-foreground"
              />
              <span class="truncate">{{ entry.name }}</span>
              <Icon
                v-if="project === entry.name"
                icon="lucide:check"
                class="ml-auto size-4"
              />
            </DropdownMenuItem>
            <p
              v-if="!filteredProjects.length"
              class="px-2 py-4 text-center text-sm text-muted-foreground"
            >
              No project found
            </p>
          </div>

          <DropdownMenuSeparator class="my-1 h-px bg-muted" />

          <!-- The submenu repeats the pattern: its own field, its own list. -->
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              class="data-[state=open]:bg-muted"
              :class="[itemClass]"
            >
              <Icon
                icon="lucide:tag"
                class="size-4 text-muted-foreground"
              />
              Change label
              <Icon
                icon="lucide:chevron-right"
                class="ml-auto size-4 text-muted-foreground"
              />
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                class="z-[100] w-[14rem] overflow-hidden rounded-lg border border-muted bg-card p-1 shadow-lg"
                :side-offset="4"
                :align-offset="-4"
                @open-auto-focus="focusInput($event, labelInput)"
              >
                <div class="mb-1 flex items-center gap-1 border-b border-muted px-1">
                  <Icon
                    icon="lucide:search"
                    class="size-3.5 shrink-0 text-muted-foreground"
                  />
                  <input
                    ref="labelInput"
                    v-model="labelQuery"
                    :class="inputClass"
                    placeholder="Filter labels…"
                    @keydown.down.prevent="focusFirstItem"
                  >
                </div>

                <DropdownMenuItem
                  v-for="entry in filteredLabels"
                  :key="entry.name"
                  :class="itemClass"
                  @select="choose(entry, 'label')"
                >
                  <Icon
                    :icon="entry.icon"
                    class="size-4 text-muted-foreground"
                  />
                  <span class="truncate">{{ entry.name }}</span>
                  <Icon
                    v-if="label === entry.name"
                    icon="lucide:check"
                    class="ml-auto size-4"
                  />
                </DropdownMenuItem>
                <p
                  v-if="!filteredLabels.length"
                  class="px-2 py-4 text-center text-sm text-muted-foreground"
                >
                  No label found
                </p>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>

    <p class="text-xs text-muted-foreground">
      {{ project }} · {{ label }}
    </p>
  </div>
</template>
