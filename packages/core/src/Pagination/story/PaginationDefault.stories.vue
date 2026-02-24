<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from '..'

const { Story } = defineMeta({
  title: 'Pagination/Default',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <PaginationRoot
      :total="34"
      :sibling-count="1"
      :items-per-page="10"
    >
      <PaginationList
        v-slot="{ items }"
        class="flex items-center gap-2 "
      >
        <PaginationFirst />
        <PaginationPrev />
        <template v-for="(page, index) in items">
          <PaginationListItem
            v-if="page.type === 'page'"
            :key="index"
            class="border rounded px-4 py-2 data-[selected]:bg-grass8"
            :value="page.value"
          >
            {{ page.value }}
          </PaginationListItem>
          <PaginationEllipsis
            v-else
            :key="page.type"
            :index="index"
            class="border rounded px-4 py-2 "
          >
            &#8230;
          </PaginationEllipsis>
        </template>
        <PaginationNext />
        <PaginationLast />
      </PaginationList>
    </PaginationRoot>
  </Story>
</template>
