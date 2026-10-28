<script setup>
// TagGroup: N instances of a typical composition (closed/default state)
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <TagGroupRoot
      selection-mode="single"
      aria-label="Tags"
    >
      <TagGroupItem
        v-for="t in ['News', 'Travel', 'Gaming']"
        :key="t"
        :value="t"
      >
        <TagGroupItemText>{{ t }}</TagGroupItemText><TagGroupItemDelete>x</TagGroupItemDelete>
      </TagGroupItem>
    </TagGroupRoot>
  </div>
</template>
