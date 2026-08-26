<script setup lang="ts">
import type { Payment } from './data'
import { Icon } from '@iconify/vue'
import { CheckboxIndicator, CheckboxRoot, ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuSeparator, ContextMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger, PaginationEllipsis, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot, ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'
import { computed, ref } from 'vue'
import { currency, payments, statusStyles } from './data'

const PER_PAGE = 6

type SortKey = 'customer' | 'amount'

const rows = ref<Payment[]>([...payments])
const selected = ref(new Set<number>())
const sortKey = ref<SortKey>('customer')
const sortDesc = ref(false)
const page = ref(1)
const lastAction = ref('')

const sorted = computed(() => [...rows.value].sort((a, b) => {
  const left = a[sortKey.value]
  const right = b[sortKey.value]
  const order = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right))
  return sortDesc.value ? -order : order
}))

const pageRows = computed(() => sorted.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))

/**
 * Tri-state header checkbox: `'indeterminate'` whenever the page is partly
 * selected, which is what gives the dash instead of a tick.
 */
const pageSelection = computed<boolean | 'indeterminate'>({
  get() {
    const count = pageRows.value.filter(row => selected.value.has(row.id)).length
    if (count === 0)
      return false
    return count === pageRows.value.length ? true : 'indeterminate'
  },
  set(value) {
    for (const row of pageRows.value) {
      if (value === true)
        selected.value.add(row.id)
      else
        selected.value.delete(row.id)
    }
  },
})

function toggleRow(row: Payment, checked: boolean | 'indeterminate') {
  if (checked === true)
    selected.value.add(row.id)
  else
    selected.value.delete(row.id)
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key)
    sortDesc.value = !sortDesc.value
  else
    sortKey.value = key
  page.value = 1
}

const rowActions = [
  { id: 'view', label: 'View details', icon: 'lucide:eye' },
  { id: 'copy', label: 'Copy email', icon: 'lucide:copy' },
  { id: 'delete', label: 'Delete', icon: 'lucide:trash-2', destructive: true },
] as const

function runAction(actionId: string, row: Payment) {
  if (actionId === 'delete') {
    rows.value = rows.value.filter(item => item.id !== row.id)
    selected.value.delete(row.id)
    // Deleting the last row of the final page would strand the viewer there.
    page.value = Math.min(page.value, Math.max(1, Math.ceil(rows.value.length / PER_PAGE)))
  }
  lastAction.value = `${rowActions.find(action => action.id === actionId)!.label} → ${row.customer}`
}

const checkboxClass = 'grid size-4 shrink-0 place-items-center rounded border border-muted-foreground/40 bg-background data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40'
const menuContentClass = 'z-[100] min-w-[11rem] rounded-lg border border-muted bg-card p-1 shadow-lg will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade'
const menuItemClass = 'flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none data-[highlighted]:bg-muted'
</script>

<template>
  <div class="w-full max-w-[640px]">
    <ScrollAreaRoot
      class="overflow-hidden rounded-xl border border-muted bg-card"
      type="auto"
    >
      <ScrollAreaViewport class="w-full">
        <table class="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr class="border-b border-muted text-left">
              <th
                scope="col"
                class="w-9 px-3 py-2.5"
              >
                <CheckboxRoot
                  v-model="pageSelection"
                  :class="checkboxClass"
                  aria-label="Select all rows on this page"
                >
                  <CheckboxIndicator class="text-primary-foreground">
                    <Icon
                      :icon="pageSelection === 'indeterminate' ? 'lucide:minus' : 'lucide:check'"
                      class="size-3"
                    />
                  </CheckboxIndicator>
                </CheckboxRoot>
              </th>
              <th
                scope="col"
                class="px-3 py-2.5 font-medium"
              >
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
                  @click="toggleSort('customer')"
                >
                  Customer
                  <Icon
                    :icon="sortKey === 'customer' ? (sortDesc ? 'lucide:arrow-down' : 'lucide:arrow-up') : 'lucide:chevrons-up-down'"
                    class="size-3.5"
                  />
                </button>
              </th>
              <th
                scope="col"
                class="px-3 py-2.5 font-medium text-muted-foreground"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-3 py-2.5 text-right font-medium"
              >
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
                  @click="toggleSort('amount')"
                >
                  Amount
                  <Icon
                    :icon="sortKey === 'amount' ? (sortDesc ? 'lucide:arrow-down' : 'lucide:arrow-up') : 'lucide:chevrons-up-down'"
                    class="size-3.5"
                  />
                </button>
              </th>
              <th
                scope="col"
                class="w-10 px-3 py-2.5"
              >
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- The same `rowActions` list feeds both menus, so right-click and
                 the ⋯ button can never drift apart. -->
            <ContextMenuRoot
              v-for="row in pageRows"
              :key="row.id"
            >
              <ContextMenuTrigger as-child>
                <tr
                  class="border-b border-muted last:border-0 data-[state=open]:bg-muted"
                  :class="selected.has(row.id) && 'bg-muted/60'"
                >
                  <td class="px-3 py-2.5">
                    <CheckboxRoot
                      :model-value="selected.has(row.id)"
                      :class="checkboxClass"
                      :aria-label="`Select ${row.customer}`"
                      @update:model-value="toggleRow(row, $event)"
                    >
                      <CheckboxIndicator class="text-primary-foreground">
                        <Icon
                          icon="lucide:check"
                          class="size-3"
                        />
                      </CheckboxIndicator>
                    </CheckboxRoot>
                  </td>
                  <td class="px-3 py-2.5">
                    <span class="block truncate font-medium text-foreground">{{ row.customer }}</span>
                    <span class="block truncate text-xs text-muted-foreground">{{ row.email }}</span>
                  </td>
                  <td class="px-3 py-2.5">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                      :class="statusStyles[row.status]"
                    >
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono text-foreground">
                    {{ currency.format(row.amount) }}
                  </td>
                  <td class="px-3 py-2.5">
                    <DropdownMenuRoot>
                      <DropdownMenuTrigger
                        class="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        :aria-label="`Actions for ${row.customer}`"
                      >
                        <Icon
                          icon="lucide:ellipsis"
                          class="size-4"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent
                          :class="menuContentClass"
                          align="end"
                          :side-offset="4"
                        >
                          <template
                            v-for="action in rowActions"
                            :key="action.id"
                          >
                            <DropdownMenuSeparator
                              v-if="action.destructive"
                              class="my-1 h-px bg-muted"
                            />
                            <DropdownMenuItem
                              :class="[menuItemClass, action.destructive && 'text-destructive']"
                              @select="runAction(action.id, row)"
                            >
                              <Icon
                                :icon="action.icon"
                                class="size-4"
                              />
                              {{ action.label }}
                            </DropdownMenuItem>
                          </template>
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenuRoot>
                  </td>
                </tr>
              </ContextMenuTrigger>

              <ContextMenuPortal>
                <ContextMenuContent :class="menuContentClass">
                  <template
                    v-for="action in rowActions"
                    :key="action.id"
                  >
                    <ContextMenuSeparator
                      v-if="action.destructive"
                      class="my-1 h-px bg-muted"
                    />
                    <ContextMenuItem
                      :class="[menuItemClass, action.destructive && 'text-destructive']"
                      @select="runAction(action.id, row)"
                    >
                      <Icon
                        :icon="action.icon"
                        class="size-4"
                      />
                      {{ action.label }}
                    </ContextMenuItem>
                  </template>
                </ContextMenuContent>
              </ContextMenuPortal>
            </ContextMenuRoot>
          </tbody>
        </table>
      </ScrollAreaViewport>

      <ScrollAreaScrollbar
        class="flex h-2 touch-none select-none bg-muted/50 p-0.5"
        orientation="horizontal"
      >
        <ScrollAreaThumb class="relative flex-1 rounded-full bg-muted-foreground/40" />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs text-muted-foreground">
        {{ selected.size }} of {{ rows.length }} selected
        <template v-if="lastAction">
          · last action: {{ lastAction }}
        </template>
      </p>

      <PaginationRoot
        v-model:page="page"
        :total="rows.length"
        :items-per-page="PER_PAGE"
        :sibling-count="1"
      >
        <PaginationList
          v-slot="{ items }"
          class="flex items-center gap-1"
        >
          <PaginationPrev class="grid size-8 place-items-center rounded-md text-foreground hover:bg-muted disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/40">
            <Icon
              icon="lucide:chevron-left"
              class="size-4"
            />
          </PaginationPrev>
          <template v-for="(item, index) in items">
            <PaginationListItem
              v-if="item.type === 'page'"
              :key="index"
              :value="item.value"
              class="grid size-8 place-items-center rounded-md text-sm text-foreground hover:bg-muted data-[selected]:bg-primary data-[selected]:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {{ item.value }}
            </PaginationListItem>
            <PaginationEllipsis
              v-else
              :key="item.type"
              :index="index"
              class="grid size-8 place-items-center text-muted-foreground"
            >
              &#8230;
            </PaginationEllipsis>
          </template>
          <PaginationNext class="grid size-8 place-items-center rounded-md text-foreground hover:bg-muted disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/40">
            <Icon
              icon="lucide:chevron-right"
              class="size-4"
            />
          </PaginationNext>
        </PaginationList>
      </PaginationRoot>
    </div>
  </div>
</template>
