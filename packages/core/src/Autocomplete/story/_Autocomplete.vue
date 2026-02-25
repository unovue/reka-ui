<script setup lang="ts">
import type { AutocompleteRootEmits, AutocompleteRootProps } from '..'
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useForwardPropsEmits } from '@/shared'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteEmpty, AutocompleteGroup, AutocompleteInput, AutocompleteItem, AutocompleteLabel, AutocompleteRoot, AutocompleteSeparator, AutocompleteTrigger, AutocompleteViewport } from '..'

const props = defineProps<AutocompleteRootProps>()
const emits = defineEmits<AutocompleteRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
const v = ref<string>(props.defaultValue ?? '')

const options = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
const vegetables = ['Aubergine', 'Broccoli', 'Carrot', 'Courgette', 'Leek']

const open = ref(props.open)
</script>

<template>
  <AutocompleteRoot
    v-bind="forwarded"
    v-model="v"
    v-model:open="open"
    name="test"
  >
    <AutocompleteAnchor class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
      <AutocompleteInput
        class="bg-transparent outline-none text-grass11 placeholder-gray-400"
        placeholder="Placeholder..."
      />
      <AutocompleteTrigger>
        <Icon
          icon="radix-icons:chevron-down"
          class="h-4 w-4 text-grass11"
        />
      </AutocompleteTrigger>
    </AutocompleteAnchor>
    <AutocompleteContent class="mt-2 min-w-[160px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
      <AutocompleteViewport class="p-[5px]">
        <AutocompleteEmpty class="text-[13px] leading-none text-grass11 px-[25px] py-[8px]">
          No results found
        </AutocompleteEmpty>

        <AutocompleteGroup>
          <AutocompleteLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
            Fruits
          </AutocompleteLabel>

          <AutocompleteItem
            v-for="(option, index) in options"
            :key="index"
            class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
            :value="option"
          >
            <span>
              {{ option }}
            </span>
          </AutocompleteItem>
          <AutocompleteSeparator class="h-[1px] bg-grass6 m-[5px]" />
        </AutocompleteGroup>

        <AutocompleteGroup>
          <AutocompleteLabel
            class="px-[25px] text-xs leading-[25px] text-mauve11"
          >
            Vegetables
          </AutocompleteLabel>
          <AutocompleteItem
            v-for="(option, index) in vegetables"
            :key="index"
            class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
            :value="option"
          >
            <span>
              {{ option }}
            </span>
          </AutocompleteItem>
        </AutocompleteGroup>
      </AutocompleteViewport>
    </AutocompleteContent>
  </AutocompleteRoot>
</template>
