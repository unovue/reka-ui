<script setup>
// Autocomplete: N instances of a typical composition (closed/default state)
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompletePortal, AutocompleteRoot, AutocompleteTrigger, AutocompleteViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
const opts = ['Apple', 'Banana', 'Cherry', 'Grape', 'Melon']
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <AutocompleteRoot>
      <AutocompleteAnchor>
        <AutocompleteInput placeholder="Fruit" />
        <AutocompleteTrigger class="trg">
          v
        </AutocompleteTrigger>
      </AutocompleteAnchor>
      <AutocompletePortal>
        <AutocompleteContent>
          <AutocompleteViewport>
            <AutocompleteItem
              v-for="o in opts"
              :key="o"
              :value="o"
            >
              {{ o }}
            </AutocompleteItem>
          </AutocompleteViewport>
        </AutocompleteContent>
      </AutocompletePortal>
    </AutocompleteRoot>
  </div>
</template>
