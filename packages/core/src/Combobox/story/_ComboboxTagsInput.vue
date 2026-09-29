<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFilter } from '@/shared'
import { TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { ComboboxAnchor, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport } from '..'

const props = withDefaults(defineProps<{
  addOnBlur?: boolean
}>(), {
  addOnBlur: false,
})

const { contains } = useFilter({ sensitivity: 'base' })

const query = ref('')
const values = ref<string[]>([])
const options = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']

const filteredOptions = computed(() => options.filter(option => contains(option, query.value) && !values.value.includes(option)))
</script>

<template>
  <ComboboxRoot
    v-model="values"
    multiple
  >
    <ComboboxAnchor>
      <TagsInputRoot
        v-slot="{ modelValue: tags }"
        v-model="values"
        :add-on-blur="props.addOnBlur"
        delimiter=""
      >
        <TagsInputItem
          v-for="(item, index) in tags"
          :key="index"
          :value="item"
        >
          <TagsInputItemText />
        </TagsInputItem>

        <ComboboxInput
          v-model="query"
          as-child
        >
          <TagsInputInput
            placeholder="Fruits..."
            @keydown.enter.prevent
          />
        </ComboboxInput>
      </TagsInputRoot>
    </ComboboxAnchor>
    <ComboboxContent>
      <ComboboxViewport>
        <ComboboxGroup>
          <ComboboxItem
            v-for="(option, index) in filteredOptions"
            :key="index"
            :value="option"
          >
            <span>{{ option }}</span>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
