<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot } from '..'

const toggleStateSingle = ref<string | null>(null)
const toggleStateMultiple = ref<string[] | string | null>('123')

const toggleGroupItemClasses
  = 'hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 flex h-[35px] w-[35px] items-center justify-center bg-white text-base leading-4 first:rounded-l last:rounded-r focus:z-10 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none'
</script>

<template>
  <Story
    title="Toggle Group/Demo"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <ToggleGroupRoot
        v-model="toggleStateSingle"
        class="flex"
      >
        <ToggleGroupItem
          value="left"
          aria-label="Toggle italic"
          :class="toggleGroupItemClasses"
        >
          <Icon
            icon="radix-icons:text-align-left"
            class="text-black"
          />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="center"
          aria-label="Toggle italic"
          :class="toggleGroupItemClasses"
        >
          <Icon
            icon="radix-icons:text-align-center"
            class="text-black"
          />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="right"
          aria-label="Toggle italic"
          :class="toggleGroupItemClasses"
        >
          <Icon
            icon="radix-icons:text-align-right"
            class="text-black"
          />
        </ToggleGroupItem>
      </ToggleGroupRoot>
      <br>
      <ToggleGroupRoot
        v-model="toggleStateMultiple"
        type="multiple"
        class="flex"
      >
        <ToggleGroupItem
          :value="{ val: 'bold' }"
          aria-label="Toggle Bold"
          :class="toggleGroupItemClasses"
        >
          <Icon
            icon="radix-icons:font-bold"
            class="text-black"
          />
        </ToggleGroupItem>
        <ToggleGroupItem
          :value="{ val: 'italic' }"
          aria-label="Toggle italic"
          :class="toggleGroupItemClasses"
        >
          <Icon
            icon="radix-icons:font-italic"
            class="text-black"
          />
        </ToggleGroupItem>
        <ToggleGroupItem
          :value="{ val: 'strikethrough' }"
          aria-label="Toggle Strikethrough"
          :class="toggleGroupItemClasses"
        >
          <Icon
            icon="radix-icons:strikethrough"
            class="text-black"
          />
        </ToggleGroupItem>
      </ToggleGroupRoot>
    </Variant>
  </Story>
</template>
