<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteEmpty, AutocompleteGroup, AutocompleteInput, AutocompleteItem, AutocompleteLabel, AutocompleteRoot, AutocompleteSeparator, AutocompleteTrigger, AutocompleteViewport } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const v = ref('')

const options = [
  { name: 'Fruit', children: [
    { name: 'Apple' },
    { name: 'Banana' },
    { name: 'Orange' },
    { name: 'Honeydew' },
    { name: 'Grapes' },
    { name: 'Watermelon' },
    { name: 'Cantaloupe' },
    { name: 'Pear' },
  ] },
  { name: 'Vegetable', children: [
    { name: 'Cabbage' },
    { name: 'Broccoli' },
    { name: 'Carrots' },
    { name: 'Lettuce' },
    { name: 'Spinach' },
    { name: 'Bok Choy' },
    { name: 'Cauliflower' },
    { name: 'Potatoes' },
  ] },
]
</script>

<template>
  <AutocompleteRoot
    v-model="v"
    class="AutocompleteRoot"
  >
    <AutocompleteAnchor class="AutocompleteAnchor">
      <AutocompleteInput
        class="AutocompleteInput"
        placeholder="Type or select an option..."
      />
      <AutocompleteTrigger>
        <Icon
          icon="radix-icons:chevron-down"
          class="AutocompleteIcon"
        />
      </AutocompleteTrigger>
    </AutocompleteAnchor>

    <AutocompleteContent class="AutocompleteContent">
      <AutocompleteViewport class="AutocompleteViewport">
        <AutocompleteEmpty class="AutocompleteEmpty" />

        <template
          v-for="(group, index) in options"
          :key="group.name"
        >
          <AutocompleteGroup>
            <AutocompleteSeparator
              v-if="index !== 0"
              class="AutocompleteSeparator"
            />

            <AutocompleteLabel class="AutocompleteLabel">
              {{ group.name }}
            </AutocompleteLabel>

            <AutocompleteItem
              v-for="option in group.children"
              :key="option.name"
              :value="option.name"
              class="AutocompleteItem"
            >
              <span>
                {{ option.name }}
              </span>
            </AutocompleteItem>
          </AutocompleteGroup>
        </template>
      </AutocompleteViewport>
    </AutocompleteContent>
  </AutocompleteRoot>
</template>
