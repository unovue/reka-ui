<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { TreeItem, TreeRoot } from '..'
import { items } from './constants'
</script>

<template>
  <Story
    title="Tree/Checkbox"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        v-slot="{ flattenItems }"
        class="list-none select-none w-64 bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
        :items="items"
        :get-key="(item) => item.title"
        multiple
        propagate-select
        bubble-select
      >
        <TreeItem
          v-for="item in flattenItems"
          :key="item._id"
          v-slot="{ handleSelect, isSelected, isIndeterminate }"
          v-bind="item.bind"
          :style="{ 'margin-left': `${item.level - 1}rem` }"
          class="flex items-center py-1 px-2 my-0.5 rounded w-max outline-none focus:ring-grass9 focus:ring-2 data-[selected]:bg-grass4"
          @select="(event) => {
            if (event.detail.originalEvent.type === 'click')
              event.preventDefault()
          }"
        >
          <Icon
            v-if="item.hasChildren"
            icon="radix-icons:chevron-down"
            class="h-4 w-4"
          />
          <input
            :checked="isSelected"
            type="checkbox"
            tabindex="-1"
            :indeterminate="isIndeterminate"
            @click.stop
            @change="handleSelect"
          >
          <div class="pl-2">
            {{ item.value.title }}
          </div>
        </TreeItem>
      </TreeRoot>
    </Variant>
  </Story>
</template>
