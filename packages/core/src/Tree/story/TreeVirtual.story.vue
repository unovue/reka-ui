<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { countryList } from '@/shared/constant'
import { TreeItem, TreeRoot, TreeVirtualizer } from '..'

function groupCountriesByFirstLetter(countries: string[]) {
  const grouped = countries.reduce((acc, country) => {
    const firstLetter = country[0].toUpperCase()
    if (!acc[firstLetter])
      acc[firstLetter] = { title: firstLetter, children: [] }

    acc[firstLetter].children.push({ title: country })
    return acc
  }, {} as { [key: string]: { title: string, children: { title: string }[] } })

  return Object.values(grouped)
}

const items = groupCountriesByFirstLetter(countryList)
</script>

<template>
  <Story
    title="Tree/Virtual"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        :items="items"
        :get-key="(item) => item.title"
        multiple
        selection-behavior="replace"
        propagate-select
        class="list-none select-none w-64 h-80 overflow-y-auto bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
      >
        <TreeVirtualizer
          v-slot="{ item }"
          :text-content="(item) => item.title"
        >
          <TreeItem
            class="flex items-center py-1 px-2 my-0.5 rounded w-max outline-none focus:ring-grass9 focus:ring-2 data-[selected]:bg-grass4"
            :style="{ 'margin-left': `${item.level - 1}rem` }"
            v-bind="item.bind"
          >
            <Icon
              v-if="item.hasChildren"
              icon="radix-icons:chevron-down"
              class="h-4 w-4"
            />
            <div class="pl-2">
              {{ item.value.title }}
            </div>
          </TreeItem>
        </TreeVirtualizer>
      </TreeRoot>
    </Variant>
  </Story>
</template>
