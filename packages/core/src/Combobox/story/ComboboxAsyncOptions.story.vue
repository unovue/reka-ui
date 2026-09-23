<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useDebounceFn, useFetch } from '@vueuse/core'
import { ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '..'

const value = ref('')
const query = ref('')

const { data, execute, isFetching } = useFetch('https://jsonplaceholder.typicode.com/comments', {
  immediate: false,
  initialData: [],
  afterFetch: (ctx) => {
    ctx.data = (ctx.data?.filter(i => i.name.toLowerCase().includes(query.value.toLowerCase())) ?? []).map(i => i.name)
    return ctx
  },

}).get().json<string[]>()

const executeDebounced = useDebounceFn(() => {
  if (!query.value) {
    return
  }

  execute()
}, 1000, {
  rejectOnCancel: true,
})

function onQueryUpdate(val: string) {
  query.value = val

  if (val) {
    executeDebounced()
  }
  else {
    data.value = []
  }
}
</script>

<template>
  <Story
    title="Combobox/Async Options"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <ComboboxRoot
        v-model="value"
      >
        <ComboboxAnchor class="max-w-[200px] min-w-[160px] inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
          <ComboboxInput
            :model-value="query"
            class="bg-transparent outline-none text-grass11 placeholder-gray-400 "
            placeholder="Test"
            @update:model-value="onQueryUpdate"
          />
          <ComboboxTrigger>
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 text-grass11"
            />
          </ComboboxTrigger>
        </ComboboxAnchor>

        <ComboboxContent class="mt-2 min-w-[160px] max-w-[200px] bg-white overflow-hidden rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
          <ComboboxViewport class="p-[5px] max-h-64 overflow-auto">
            <div
              v-if="isFetching"
              class="text-gray-400 flex justify-center py-2"
            >
              <Icon
                icon="radix-icons:symbol"
                class="h-4 w-4 text-grass11 animate-spin"
              />
            </div>
            <ComboboxEmpty
              v-else-if="data?.length === 0"
              class="text-grass11"
            />

            <template v-else>
              <ComboboxItem
                v-for="option in data"
                :key="option"
                class="text-[13px]  leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                :value="option"
              >
                <ComboboxItemIndicator
                  class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                >
                  <Icon icon="radix-icons:check" />
                </ComboboxItemIndicator>
                <span class="truncate">
                  {{ option }}
                </span>
              </ComboboxItem>
            </template>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>
  </Story>
</template>
