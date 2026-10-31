<script setup lang="ts">
import type {
  AutocompleteEmptyProps,
  AutocompleteItemEmits,
  AutocompleteItemProps,
  AutocompleteVirtualizerProps,
} from 'reka-ui'

// defineProps must resolve through the alias: Vue's compiler-sfc cannot resolve a renamed re-export (https://github.com/vuejs/core/pull/15649).
defineProps<AutocompleteEmptyProps>()

// Generic aliases: consumers pass a type argument, so the aliases keep their type parameters.
type Item = AutocompleteItemProps<string>
type ItemEmits = AutocompleteItemEmits<string>
type Virtualizer = AutocompleteVirtualizerProps<string>
</script>

<template>
  <p>autocomplete empty</p>
</template>
