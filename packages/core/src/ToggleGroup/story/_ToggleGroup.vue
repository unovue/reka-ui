<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from '..'
import { Icon } from '@iconify/vue'
import { useForwardPropsEmits } from '@/shared'
import { ToggleGroupItem, ToggleGroupRoot } from '..'

const props = defineProps<ToggleGroupRootProps>()
const emits = defineEmits<ToggleGroupRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const toggleGroupItemClasses
  = 'hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 flex h-[35px] w-[35px] items-center justify-center bg-white text-base leading-4 first:rounded-l last:rounded-r focus:z-10 focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none'
</script>

<template>
  <ToggleGroupRoot
    v-bind="forwarded"
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
</template>
