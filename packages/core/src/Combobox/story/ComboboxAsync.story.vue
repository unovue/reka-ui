<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useFetch } from '@vueuse/core'
import { ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '..'

const v = ref<{ id: number }[]>([])

const { data, execute, isFinished } = useFetch('https://jsonplaceholder.typicode.com/comments', {
  immediate: false,
  initialData: [],
}).get().json<{ id: number }[]>()

async function handleOpen(val: boolean) {
  if (val && data.value?.length === 0)
    execute()
}
</script>

<template>
  <Story
    title="Combobox/Async"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <ComboboxRoot
        v-model="v"
        @update:open="handleOpen"
        @update:model-value="v => {
          console.log(v)
        }"
      >
        <ComboboxAnchor class="min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
          <ComboboxInput
            class="bg-transparent outline-none text-grass11 placeholder-gray-400"
            placeholder="Test"
          />
          <ComboboxTrigger>
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 text-grass11"
            />
          </ComboboxTrigger>
        </ComboboxAnchor>

        <ComboboxContent class="mt-2 min-w-[160px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
          <ComboboxViewport class="p-[5px] max-h-64 overflow-auto">
            <div
              v-if="!data?.length "
              class="text-gray-400 text-center py-2"
            >
              Loading
            </div>

            <ComboboxItem
              v-for="option in data"
              :key="option.id"
              class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
              :value="option"
            >
              <ComboboxItemIndicator
                class="absolute left-0 w-[25px] inline-flex items-center justify-center"
              >
                <Icon icon="radix-icons:check" />
              </ComboboxItemIndicator>
              <span>
                {{ option.id }}
              </span>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>
  </Story>
</template>
