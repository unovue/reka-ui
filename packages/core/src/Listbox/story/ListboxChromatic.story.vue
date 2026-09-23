<script setup lang="ts">
import type { GenericComponentInstance } from '@/shared/types'
import { computed, ref } from 'vue'
import { countryList } from '@/shared/constant'
import { ListboxContent, ListboxItem, ListboxRoot } from '..'

const options = computed(() => countryList.slice(0, 20))
const singleControl = ref()
const multipleControl = ref()

const listboxRef = ref<GenericComponentInstance<typeof ListboxRoot>>()
</script>

<template>
  <Story
    title="Listbox/Chromatic"
    :layout="{ type: 'grid', iframe: false, width: '50%' }"
  >
    <Variant title="Uncontrolled (Single)">
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
    </Variant>

    <Variant title="Uncontrolled (Multiple)">
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
    </Variant>

    <Variant title="Controlled (Single)">
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
    </Variant>

    <Variant title="Controlled (Multiple)">
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
    </Variant>

    <Variant title="Object (Single)">
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
    </Variant>

    <Variant title="Object (Multiple)">
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
    </Variant>

    <Variant title="Replace behavior (Single)">
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
    </Variant>

    <Variant title="Replace behavior (Multiple)">
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
    </Variant>

    <Variant title="Highlight on hover">
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
    </Variant>

    <Variant title="Highlight imperative">
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
    </Variant>

    <Variant title="Orientation (Horizontal)">
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
    </Variant>
  </Story>
</template>
