<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxLabel, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '@/Combobox'
import { useFilter } from '@/shared'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '..'

const { contains } = useFilter({ sensitivity: 'base' })

const query = ref('')
const values = ref(['Apple'])
const options = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']

const filteredOptions = computed(() => options.filter(option => contains(option, query.value) && !values.value.includes(option)))

watch(values, () => {
  query.value = ''
}, { deep: true })
</script>

<template>
  <Story
    title="TagsInput/Combobox"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <ComboboxRoot
        v-model="values"
        multiple
        class="my-4"
      >
        <ComboboxAnchor class="w-[400px] inline-flex items-center justify-between rounded-lg p-2 text-[13px] leading-none  gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-grass9 outline-none">
          <TagsInputRoot
            v-slot="{ modelValue: tags }"
            v-model="values"
            delimiter=""
            class="flex gap-2 items-center rounded-lg flex-wrap"
          >
            <TagsInputItem
              v-for="item in tags"
              :key="item"
              :value="item"
              class="flex items-center justify-center gap-2 text-white bg-grass10 aria-[current=true]:bg-grass11 rounded px-2 py-1"
            >
              <TagsInputItemText class="text-sm" />
              <TagsInputItemDelete>
                <Icon icon="lucide:x" />
              </TagsInputItemDelete>
            </TagsInputItem>

            <ComboboxInput
              v-model="query"
              as-child
            >
              <TagsInputInput
                placeholder="Fruits..."
                class="focus:outline-none flex-1 rounded bg-transparent  placeholder:text-mauve10 px-1  "
                @keydown.enter.prevent
              />
            </ComboboxInput>
          </TagsInputRoot>

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
                Fruits
              </ComboboxLabel>

              <ComboboxItem
                v-for="(option, index) in filteredOptions"
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
                  {{ option }}
                </span>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
    </Variant>
  </Story>
</template>
