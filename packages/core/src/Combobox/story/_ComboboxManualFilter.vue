<script setup lang="ts">
import type { ComboboxInputProps, ComboboxRootProps } from '..'
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { useFilter } from '@/shared'
import { ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxLabel, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '..'

const props = defineProps<ComboboxRootProps & { input?: ComboboxInputProps }>()
const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const v = ref<any>(people[0])
const open = ref(props.open)

const query = ref('')
const { startsWith } = useFilter({ sensitivity: 'base' })
const filteredPeople = computed(() => people.filter(p => startsWith(p.name, query.value)))
</script>

<template>
  <ComboboxRoot
    v-bind="props"
    v-model="v"
    v-model:open="open"
    name="test"
  >
    <ComboboxAnchor class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
      <ComboboxInput
        v-bind="props.input"
        class="bg-transparent outline-none text-grass11 placeholder-gray-400"
        placeholder="Placeholder..."
        @change="(ev: InputEvent) => query = (ev.target as HTMLInputElement)?.value"
      />
      <ComboboxTrigger>
        <Icon
          icon="radix-icons:chevron-down"
          class="h-4 w-4 text-grass11"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxContent class="mt-2 min-w-[160px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
      <ComboboxViewport class="p-[5px]">
        <ComboboxGroup>
          <ComboboxLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
            People
          </ComboboxLabel>

          <ComboboxItem
            v-for="(option, index) in filteredPeople"
            :key="index"
            class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
            :value="option"
          >
            <ComboboxItemIndicator
              class="absolute left-0 w-[25px] inline-flex items-center justify-center"
            >
              <Icon icon="radix-icons:check" />
            </ComboboxItemIndicator>
            <span>
              {{ option.name }}
            </span>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
