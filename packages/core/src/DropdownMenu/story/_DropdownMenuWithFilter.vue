<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuFilter,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '..'

const props = defineProps<{
  defaultOpen?: boolean
  disabledFilter?: boolean
}>()

const toggleState = ref(props.defaultOpen ?? false)
const filterText = ref('')

const items = [
  { value: 'new-tab', label: 'New Tab' },
  { value: 'new-window', label: 'New Window' },
  { value: 'bookmarks', label: 'Show Bookmarks' },
  { value: 'history', label: 'Show History' },
]

const filteredItems = computed(() => {
  if (!filterText.value)
    return items
  return items.filter(item =>
    item.label.toLowerCase().includes(filterText.value.toLowerCase()),
  )
})

defineExpose({
  filterText,
})
</script>

<template>
  <div>
    <DropdownMenuRoot v-model:open="toggleState">
      <DropdownMenuTrigger
        class="rounded-full w-[35px] h-[35px] inline-flex items-center justify-center text-violet11 bg-white shadow-[0_2px_10px] shadow-blackA7 outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black"
        aria-label="Customise options"
      >
        Open
      </DropdownMenuTrigger>

      <DropdownMenuPortal to="#filter-test">
        <DropdownMenuContent
          class="min-w-[220px] bg-white rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
        >
          <DropdownMenuFilter
            v-model="filterText"
            :disabled="disabledFilter"
            class="w-full px-2 py-1 text-sm outline-none border-b border-gray-200 mb-1"
            placeholder="Filter items..."
          />
          <DropdownMenuItem
            v-for="item in filteredItems"
            :key="item.value"
            :value="item.value"
            class="group text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
          >
            {{ item.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>

    <div id="filter-test" />
  </div>
</template>
