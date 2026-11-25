<script setup vapor lang="ts">
import { TagsInputClear, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '#reka'
import { ref } from 'vue'

const tags = ref(['vue', 'vapor'])
defineExpose({ tags })
</script>

<template>
  <form
    id="form"
    @submit.prevent
  >
    <TagsInputRoot
      id="tags"
      v-model="tags"
      name="tags"
    >
      <TagsInputItem
        v-for="t in tags"
        :id="`tag-${t}`"
        :key="t"
        :value="t"
      >
        <TagsInputItemText />
        <TagsInputItemDelete
          :id="`delete-${t}`"
          :aria-label="`Remove ${t}`"
        >
          x
        </TagsInputItemDelete>
      </TagsInputItem>
      <TagsInputInput
        id="input"
        aria-label="Add tag"
      />
      <!-- asChild, v-slot form -->
      <TagsInputClear
        v-slot="{ props }"
        as-child
      >
        <button
          v-bind="props"
          id="clear-slotted"
          aria-label="Clear all"
        >
          clear
        </button>
      </TagsInputClear>
    </TagsInputRoot>
  </form>
  <span id="value">{{ tags.join() }}</span>

  <!-- asChild, template form -->
  <TagsInputRoot :default-value="['x']">
    <TagsInputItem
      value="x"
      as-child
    >
      <div
        id="tag-adopted"
        data-state="mine"
      >
        <TagsInputItemText />
      </div>
    </TagsInputItem>
    <TagsInputInput aria-label="Other tag" />
  </TagsInputRoot>
</template>
