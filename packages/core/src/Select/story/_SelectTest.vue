<script setup lang="ts">
import type { SelectRootEmits, SelectRootProps } from '..'
import { Icon } from '@iconify/vue'
import { useForwardPropsEmits } from '@/shared'
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,

  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from '..'

const props = withDefaults(defineProps<SelectRootProps & { options?: any[] }>(), {
  options: () => ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple'],
})
const emits = defineEmits<SelectRootEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <div>
    <SelectRoot
      v-bind="forwarded"
      name="test"
      aria-label="Fruits"
    >
      <SelectTrigger
        class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-violet11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 outline-none"
        aria-label="Customise options"
      >
        <SelectValue placeholder="Please select a fruit" />
        <Icon
          icon="radix-icons:chevron-down"
          class="h-4 w-4"
        />
      </SelectTrigger>

      <SelectPortal to="#here">
        <SelectContent
          class="min-w-[160px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
          :side-offset="5"
          position="popper"
        >
          <SelectViewport class="p-[5px]">
            <SelectLabel
              class="px-[25px] text-xs leading-[25px] text-mauve11"
            >
              Fruits
            </SelectLabel>
            <SelectGroup>
              <SelectItem
                v-for="(option, index) in options"
                :key="index"
                class="text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
                :value="option"
              >
                <SelectItemIndicator
                  class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                >
                  <Icon icon="radix-icons:check" />
                </SelectItemIndicator>
                <SelectItemText>
                  {{ option }}
                </SelectItemText>
              </SelectItem>
            </SelectGroup>
            <SelectSeparator class="h-[1px] bg-violet6 m-[5px]" />
            <SelectLabel
              class="px-[25px] text-xs leading-[25px] text-mauve11"
            >
              Vegetables
            </SelectLabel>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <div id="here" />
  </div>
</template>
