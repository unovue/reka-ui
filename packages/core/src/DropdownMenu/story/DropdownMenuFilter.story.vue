<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { countryList } from '@/shared/constant'
import {
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuFilter,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '..'

const toggleState = ref(false)
const checkboxOne = ref(false)
const radioValue = ref('pedro')

const content = 'relative min-w-64 max-h-96 overflow-auto bg-white will-change-[opacity,transform] z-50 rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
const item = 'group w-full text-sm leading-none text-violet11 flex items-center h-7 relative pl-7 pr-2 select-none outline-none data-[state=open]:bg-violet4 data-[state=open]:text-violet11 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 data-[highlighted]:data-[state=open]:bg-violet9 data-[highlighted]:data-[state=open]:text-violet1 cursor-default rounded'
const filterInput = 'w-full px-2 py-1.5 text-sm border-none outline-none focus:ring-0 mb-1 placeholder:text-mauve9'
const separator = '-mx-1 my-1 h-px bg-mauve5'
const shortcut = 'ml-auto pl-5 text-[13px] text-mauve11 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8'

// Main menu filter
const filterText = ref('')
const allCountries = countryList.slice(0, 50)
const filteredCountries = computed(() => {
  if (!filterText.value.trim())
    return allCountries
  return allCountries.filter(c =>
    c.toLowerCase().includes(filterText.value.toLowerCase().trim()),
  )
})

// Submenu filter
const subFilterText = ref('')
const subOptions = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania', 'Antarctica']
const filteredSubOptions = computed(() => {
  if (!subFilterText.value.trim())
    return subOptions
  return subOptions.filter(opt =>
    opt.toLowerCase().includes(subFilterText.value.toLowerCase().trim()),
  )
})
</script>

<template>
  <Story
    title="DropdownMenu/Filter"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Filtered Demo">
      <div class="flex items-center justify-center min-h-screen">
        <DropdownMenuRoot v-model:open="toggleState">
          <DropdownMenuTrigger
            class="rounded-full size-10 inline-flex items-center justify-center text-violet11 bg-white shadow-[0_2px_10px] shadow-blackA7 outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black"
            aria-label="Customise options"
          >
            <Icon
              icon="radix-icons:hamburger-menu"
              class="size-4"
            />
          </DropdownMenuTrigger>

          <DropdownMenuPortal>
            <DropdownMenuContent
              :class="content"
              :side-offset="4"
            >
              <!-- Main Menu Filter -->
              <div class="sticky top-0 bg-white z-10 px-1 pt-1 pb-0.5">
                <div class="relative flex items-center border-b border-mauve5">
                  <Icon
                    icon="radix-icons:magnifying-glass"
                    class="ml-2 size-4 text-mauve11"
                  />
                  <DropdownMenuFilter
                    v-model="filterText"
                    :class="filterInput"
                    placeholder="Filter countries..."
                    auto-focus
                  />
                </div>
              </div>

              <div class="mt-1">
                <DropdownMenuItem
                  v-for="country in filteredCountries"
                  :key="country"
                  :class="item"
                  @select="() => console.log('Selected:', country)"
                >
                  <Icon
                    icon="radix-icons:globe"
                    class="absolute left-1.5 size-4 text-mauve11 group-data-[highlighted]:text-white"
                  />
                  {{ country }}
                </DropdownMenuItem>

                <div
                  v-if="filteredCountries.length === 0"
                  class="py-4 px-2 text-sm text-mauve11 text-center"
                >
                  No countries match your search
                </div>
              </div>

              <DropdownMenuSeparator :class="separator" />

              <!-- Submenu with Filter -->
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  :class="item"
                >
                  <Icon
                    icon="radix-icons:layers"
                    class="absolute left-1.5 size-4 text-mauve11 group-data-[highlighted]:text-white"
                  />
                  Filter Regions
                  <div class="ml-auto pl-5">
                    <Icon
                      icon="tabler:chevron-right"
                      class="size-3.5 text-mauve11 group-data-[highlighted]:text-white"
                    />
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent
                    :class="content"
                    :side-offset="2"
                    :align-offset="-4"
                  >
                    <div class="sticky top-0 bg-white z-10 px-1 pt-1 pb-0.5">
                      <div class="relative flex items-center border-b border-mauve5">
                        <Icon
                          icon="radix-icons:magnifying-glass"
                          class="ml-2 size-4 text-mauve11"
                        />
                        <DropdownMenuFilter
                          v-model="subFilterText"
                          :class="filterInput"
                          placeholder="Search regions..."
                          auto-focus
                        />
                      </div>
                    </div>

                    <div class="mt-1">
                      <DropdownMenuItem
                        v-for="region in filteredSubOptions"
                        :key="region"
                        :class="item"
                        @select="() => console.log('Selected region:', region)"
                      >
                        {{ region }}
                      </DropdownMenuItem>
                      <div
                        v-if="filteredSubOptions.length === 0"
                        class="py-2 px-2 text-sm text-mauve11 text-center"
                      >
                        No regions found
                      </div>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator :class="separator" />

              <DropdownMenuCheckboxItem
                v-model="checkboxOne"
                :class="item"
                @select.prevent
              >
                <DropdownMenuItemIndicator class="absolute left-0 w-7 inline-flex items-center justify-center">
                  <Icon icon="tabler:check" />
                </DropdownMenuItemIndicator>
                Show Bookmarks
                <div :class="shortcut">
                  ⌘+B
                </div>
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator :class="separator" />

              <DropdownMenuLabel class="pl-6 text-xs leading-6 text-mauve11">
                People
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup v-model="radioValue">
                <DropdownMenuRadioItem
                  :class="item"
                  value="pedro"
                  @select.prevent
                >
                  <DropdownMenuItemIndicator class="absolute left-0 w-7 inline-flex items-center justify-center">
                    <Icon icon="radix-icons:dot-filled" />
                  </DropdownMenuItemIndicator>
                  Pedro Duarte
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  :class="item"
                  value="colm"
                  @select.prevent
                >
                  <DropdownMenuItemIndicator class="absolute left-0 w-7 inline-flex items-center justify-center">
                    <Icon icon="radix-icons:dot-filled" />
                  </DropdownMenuItemIndicator>
                  Colm Tuite
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuArrow
                class="fill-white"
                :width="12"
              />
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
    </Variant>
  </Story>
</template>
