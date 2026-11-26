<script setup vapor lang="ts">
import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from '#reka'
import { ref } from 'vue'

const page = ref(1)
defineExpose({ page })
</script>

<template>
  <PaginationRoot
    id="pagination"
    v-model:page="page"
    :total="100"
    :items-per-page="10"
    :sibling-count="1"
    show-edges
  >
    <PaginationList
      id="list"
      v-slot="{ items }"
    >
      <PaginationFirst id="first">
        «
      </PaginationFirst>
      <PaginationPrev id="prev">
        ‹
      </PaginationPrev>
      <template
        v-for="(item, index) in items"
        :key="index"
      >
        <PaginationListItem
          v-if="item.type === 'page'"
          :id="`page-${item.value}`"
          :value="item.value"
        >
          {{ item.value }}
        </PaginationListItem>
        <PaginationEllipsis
          v-else
          :id="`ellipsis-${index}`"
          :index="index"
        >
          …
        </PaginationEllipsis>
      </template>
      <!-- asChild, both forms -->
      <PaginationNext as-child>
        <button
          id="next-adopted"
          aria-label="Next"
          data-state="mine"
        >
          ›
        </button>
      </PaginationNext>
      <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
      <PaginationLast
        v-slot="{ props }"
        as-child
      >
        <button
          v-bind="props"
          id="last-slotted"
        >
          »
        </button>
      </PaginationLast>
    </PaginationList>
  </PaginationRoot>
  <span id="page">{{ page }}</span>
</template>
