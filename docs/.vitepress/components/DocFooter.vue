<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useEditLink } from '../composables/edit-link'
import { usePrevNext } from '../composables/prev-next'
import DocFooterLastUpdated from './DocFooterLastUpdated.vue'

const { theme, page, frontmatter } = useData()

const editLink = useEditLink()
const control = usePrevNext()

const hasEditLink = computed(
  () => theme.value.editLink && frontmatter.value.editLink !== false,
)
const hasLastUpdated = computed(() => page.value.lastUpdated)
const showFooter = computed(
  () =>
    hasEditLink.value
    || hasLastUpdated.value
    || control.value.prev
    || control.value.next,
)
</script>

<template>
  <footer
    v-if="showFooter"
    class="my-28"
  >
    <div
      v-if="hasEditLink || hasLastUpdated"
      class="flex justify-between text-muted-foreground"
    >
      <div
        v-if="hasEditLink"
        class="text-sm text-muted-foreground hover:text-foreground"
      >
        <a
          :href="editLink.url"
          target="_blank"
          class="inline-flex gap-2 items-center"
        >
          <Icon icon="lucide:pencil-line" />
          {{ editLink.text }}
        </a>
      </div>

      <div
        v-if="hasLastUpdated"
        class="text-sm"
      >
        <DocFooterLastUpdated />
      </div>
    </div>

    <nav
      v-if="control.prev?.link || control.next?.link"
      class="flex flex-col md:flex-row items-center justify-between gap-4 mt-8"
      aria-labelledby="doc-footer-aria-label"
    >
      <span
        id="doc-footer-aria-label"
        class="sr-only"
      >
        Pager
      </span>

      <div class="w-full group">
        <a
          v-if="control.prev?.link"
          class="inline-flex flex-col bg-transparent rounded-lg border border-muted hover:border-primary w-full px-4 py-6"
          :href="control.prev.link"
        >
          <span
            class="text-xs text-muted-foreground group-hover:text-foreground"
            v-html="theme.docFooter?.prev || 'Previous page'"
          />
          <p class="inline-flex items-center gap-1 mt-2 ">
            <Icon icon="lucide:arrow-left" />
            <span
              class="text-sm font-semibold"
              v-html="control.prev.text"
            />
          </p>
        </a>
      </div>
      <div class="w-full group">
        <a
          v-if="control.next?.link"
          class="inline-flex flex-col bg-transparent items-end rounded-lg border border-muted hover:border-primary w-full px-4 py-6"
          :href="control.next.link"
        >
          <span
            class="text-xs text-muted-foreground group-hover:text-foreground"
            v-html="theme.docFooter?.next || 'Next page'"
          />

          <p class="inline-flex items-center gap-1 mt-2 ">
            <span
              class="text-sm font-semibold"
              v-html="control.next.text"
            />
            <Icon icon="lucide:arrow-right" />
          </p>
        </a>
      </div>
    </nav>
  </footer>
</template>
