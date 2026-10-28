<script setup>
// Pagination: N instances of a typical composition (closed/default state)
import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <PaginationRoot
      :total="100"
      :items-per-page="10"
      :sibling-count="1"
      show-edges
      :default-page="2"
    >
      <PaginationList v-slot="{ items }">
        <PaginationFirst>«</PaginationFirst>
        <PaginationPrev>‹</PaginationPrev>
        <template v-for="(page, index) in items">
          <PaginationListItem
            v-if="page.type === 'page'"
            :key="index"
            :value="page.value"
          >
            {{ page.value }}
          </PaginationListItem>
          <PaginationEllipsis
            v-else
            :key="page.type"
            :index="index"
          >
            …
          </PaginationEllipsis>
        </template>
        <PaginationNext class="next">
          ›
        </PaginationNext>
        <PaginationLast>»</PaginationLast>
      </PaginationList>
    </PaginationRoot>
  </div>
</template>
