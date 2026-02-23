<script setup lang="ts">
import type { GenericComponentInstance } from '@/shared/types'

import { defineMeta } from 'addon-vue-csf'
import { computed, ref } from 'vue'
import { countryList } from '@/shared/constant'
import { ListboxContent, ListboxItem, ListboxRoot } from '..'

const options = computed(() => countryList.slice(0, 20))
const singleControl = ref()
const multipleControl = ref()

const listboxRef = ref<GenericComponentInstance<typeof ListboxRoot>>()

const { Story } = defineMeta({
  title: 'Listbox/Chromatic',
})
</script>

<template>
  <Story
    name="Uncontrolled (Single)"
    as-child
  >
    <ListboxRoot class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto">
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Uncontrolled (Multiple)"
    as-child
  >
    <ListboxRoot
      :multiple="true"
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Controlled (Single)"
    as-child
  >
    <ListboxRoot
      v-model="singleControl"
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Controlled (Multiple)"
    as-child
  >
    <ListboxRoot
      v-model="multipleControl"
      :multiple="true"
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Object (Single)"
    as-child
  >
    <ListboxRoot class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto">
      <ListboxContent>
        <ListboxItem
          v-for="i in options.map(opt => ({ label: opt, value: opt.toLowerCase() }))"
          :key="i.value"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i.label }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Object (Multiple)"
    as-child
  >
    <ListboxRoot
      by="value"
      :multiple="true"
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options.map(opt => ({ label: opt, value: opt.toLowerCase() }))"
          :key="i.value"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i.label }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Replace behavior (Single)"
    as-child
  >
    <ListboxRoot
      :default-value="2"
      selection-behavior="replace"
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Replace behavior (Multiple)"
    as-child
  >
    <ListboxRoot
      multiple
      selection-behavior="replace"
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Highlight on hover"
    as-child
  >
    <ListboxRoot
      highlight-on-hover
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Highlight imperative"
    as-child
  >
    <button @click="listboxRef?.highlightItem('Anguilla')">
      Select "Anguilla"
    </button>
    <ListboxRoot
      ref="listboxRef"
      class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
    >
      <ListboxContent>
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Orientation (Horizontal)"
    as-child
  >
    <ListboxRoot
      class="w-64 h-full flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto"
      orientation="horizontal"
    >
      <ListboxContent class="flex flex-row ">
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>
</template>
