<script setup vapor lang="ts">
import type { Translations } from '@/ConfigProvider'
import { ConfigProvider, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot, PinInputInput, PinInputRoot } from '#reka'
import { ref } from 'vue'

const translations = ref<Partial<Translations>>({
  paginationNext: 'Nächste Seite',
  paginationPage: 'Seite {page}',
  pinInputLabelIndexed: ({ index, total }) => `Stelle ${index} von ${total}`,
})
defineExpose({ translations })
</script>

<template>
  <ConfigProvider :translations="translations">
    <PaginationRoot
      id="pagination"
      :total="30"
      :items-per-page="10"
    >
      <PaginationList v-slot="{ items }">
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
        </template>
        <PaginationNext id="next">
          ›
        </PaginationNext>
        <PaginationNext
          id="next-labelled"
          aria-label="Forward"
        >
          ›
        </PaginationNext>
      </PaginationList>
    </PaginationRoot>
    <PinInputRoot>
      <PinInputInput
        v-for="index in 3"
        :id="`pin-${index}`"
        :key="index"
        :index="index - 1"
      />
    </PinInputRoot>
  </ConfigProvider>
</template>
