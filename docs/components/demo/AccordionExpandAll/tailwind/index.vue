<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
import { computed, ref } from 'vue'

const faqs = [
  { value: 'billing', question: 'When am I billed?', answer: 'On the first day of each month, for the month ahead.' },
  { value: 'cancel', question: 'Can I cancel at any time?', answer: 'Yes. You keep access until the end of the paid period.' },
  { value: 'refund', question: 'Do you offer refunds?', answer: 'Within 14 days of a payment, no questions asked.' },
]

// With `type="multiple"` the model is the array of open items.
const open = ref<string[]>(['billing'])
const allOpen = computed(() => open.value.length === faqs.length)

function toggleAll() {
  open.value = allOpen.value ? [] : faqs.map(faq => faq.value)
}
</script>

<template>
  <div class="flex w-full flex-col gap-2 sm:w-[320px]">
    <button
      type="button"
      class="self-end text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      @click="toggleAll"
    >
      {{ allOpen ? 'Collapse all' : 'Expand all' }}
    </button>

    <AccordionRoot
      v-model="open"
      type="multiple"
      class="rounded-lg border border-muted bg-card"
    >
      <AccordionItem
        v-for="faq in faqs"
        :key="faq.value"
        :value="faq.value"
        class="border-b border-muted last:border-b-0"
      >
        <!-- Render the header as the heading level that fits the page outline. -->
        <AccordionHeader as="h3">
          <AccordionTrigger class="group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40">
            {{ faq.question }}
            <Icon
              icon="radix-icons:chevron-down"
              class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent class="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
          <p class="px-4 pb-3">
            {{ faq.answer }}
          </p>
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </div>
</template>
