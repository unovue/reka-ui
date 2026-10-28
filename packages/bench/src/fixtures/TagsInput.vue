<script setup>
// TagsInput: N instances of a typical composition (closed/default state)
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <TagsInputRoot
      v-slot="{ modelValue }"
      :default-value="['Apple', 'Banana']"
    >
      <TagsInputItem
        v-for="t in modelValue"
        :key="t"
        :value="t"
      >
        <TagsInputItemText /><TagsInputItemDelete class="del">
          x
        </TagsInputItemDelete>
      </TagsInputItem>
      <TagsInputInput placeholder="Add" />
    </TagsInputRoot>
  </div>
</template>
