<script setup vapor lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
  ListboxContent,
  ListboxItem,
  ListboxRoot,
  ListboxVirtualizer,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from '#reka'
import { ref } from 'vue'

const fruits = ['apple', 'banana', 'cherry']
const fruit = ref<string>()
const picked = ref<string>()
const many = Array.from({ length: 1000 }, (_, i) => `${['alpha', 'bravo', 'charlie', 'delta', 'echo'][i % 5]}-${i}`)
const virtual = ref<string>()
const search = ref<string>()
const combo = ref<any>()
</script>

<template>
  <form
    id="form"
    @submit.prevent
  >
    <SelectRoot
      v-model="fruit"
      name="fruit"
    >
      <SelectTrigger
        id="select-trigger"
        aria-label="Fruit"
      >
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          id="select-content"
          position="popper"
        >
          <SelectViewport>
            <SelectItem
              v-for="f in fruits"
              :id="`select-${f}`"
              :key="f"
              :value="f"
            >
              <SelectItemText>{{ f }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </form>
  <span id="fruit">{{ fruit }}</span>

  <ListboxRoot v-model="picked">
    <ListboxContent
      id="listbox"
      aria-label="Fruits"
    >
      <ListboxItem
        v-for="f in fruits.slice(0, 2)"
        :id="`lb-${f}`"
        :key="f"
        :value="f"
      >
        {{ f }}
      </ListboxItem>
      <!-- asChild, both forms -->
      <ListboxItem
        v-slot="{ props }"
        value="cherry"
        as-child
      >
        <div
          v-bind="props"
          id="lb-cherry"
        >
          cherry
        </div>
      </ListboxItem>
      <ListboxItem
        value="date"
        as-child
      >
        <div
          id="lb-date"
          data-state="mine"
        >
          date
        </div>
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
  <span id="picked">{{ picked }}</span>

  <ListboxRoot v-model="virtual">
    <ListboxContent
      id="vlistbox"
      aria-label="Many options"
      style="height: 200px; overflow: auto"
    >
      <ListboxVirtualizer
        v-slot="{ option }"
        :options="many"
        :text-content="(o: string) => o"
        :estimate-size="28"
      >
        <ListboxItem
          :id="`v-${option}`"
          :value="option"
          style="height: 28px"
        >
          {{ option }}
        </ListboxItem>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
  <span id="virtual">{{ virtual }}</span>

  <ComboboxRoot
    ref="combo"
    v-model="search"
  >
    <ComboboxAnchor>
      <ComboboxInput
        id="combo-input"
        aria-label="Search fruit"
      />
      <ComboboxTrigger
        id="combo-trigger"
        aria-label="Open"
      >
        v
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        id="combo-content"
        position="popper"
      >
        <ComboboxViewport>
          <ComboboxItem
            v-for="f in fruits"
            :id="`combo-${f}`"
            :key="f"
            :value="f"
          >
            {{ f }}
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
  <span id="search">{{ search }}</span>
  <!-- methods ComboboxRoot adds to its exposed instance after mount -->
  <button
    id="combo-highlight"
    @click="combo?.highlightItem('cherry')"
  >
    highlight
  </button>
</template>
