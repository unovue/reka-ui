<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ListboxContent, ListboxItem, ListboxRoot } from 'reka-ui'
import { ref } from 'vue'

const states = [
  'California',
  'Illinois',
  'Maryland',
  'Texas',
  'Florida',
  'Colorado',
  'Connecticut ',
]

const list1 = ref<string[]>([...states])
const list2 = ref<string[]>([])

const selectedList1 = ref([])
const selectedList2 = ref([])

const searchValue1 = ref([])
const searchValue2 = ref([])

function transferAction(action: '1to2' | '2to1') {
  const [fromList, toList, selectedList] = action === '1to2'
    ? [list1, list2, selectedList1]
    : [list2, list1, selectedList2]

  fromList.value = fromList.value.filter(item => !selectedList.value.includes(item))
  toList.value.push(...selectedList.value)
  selectedList.value = []
}
</script>

<template>
  <div class="text-foreground flex items-center ">
    <ListboxRoot
      v-model="selectedList1"
      class="bg-card rounded-lg border border-muted w-48"
      multiple
    >
      <div class="px-3 py-2">
        <h2 class="text-muted-foreground text-xs font-semibold">
          List 1
        </h2>
      </div>

      <ListboxContent class="h-44 overflow-auto p-1 border-t border-muted">
        <ListboxItem
          v-for="item in list1"
          :key="item"
          :value="item"
          class="text-sm px-2 py-1 cursor-default data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded select-none"
        >
          {{ item }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>

    <div class="flex mx-2 gap-2">
      <button
        class="w-8 h-8 text-lg border border-muted flex items-center justify-center rounded bg-card hover:bg-muted disabled:opacity-50"
        :disabled="!selectedList2.length"
        @click="transferAction('2to1')"
      >
        <Icon icon="lucide:chevron-left" />
      </button>
      <button
        class="w-8 h-8 text-lg border border-muted flex items-center justify-center rounded bg-card hover:bg-muted disabled:opacity-50"
        :disabled="!selectedList1.length"
        @click="transferAction('1to2')"
      >
        <Icon icon="lucide:chevron-right" />
      </button>
    </div>

    <ListboxRoot
      v-model="selectedList2"
      class="bg-card rounded-lg border border-muted w-48"
      multiple
    >
      <div class="px-3 py-2">
        <h2 class="text-muted-foreground text-xs font-semibold">
          List 2
        </h2>
      </div>

      <ListboxContent class="h-44 overflow-auto p-1 border-t border-muted">
        <ListboxItem
          v-for="item in list2"
          :key="item"
          :value="item"
          class="text-sm px-2 py-1 cursor-default data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded select-none"
        >
          {{ item }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </div>
</template>
