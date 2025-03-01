<script setup lang="ts">
// @ts-expect-error ignoring
import Mark from 'mark.js/src/vanilla.js'
import MiniSearch, { type SearchResult } from 'minisearch'
import { useData } from 'vitepress'
import { DialogClose, type GenericComponentInstance, ListboxContent, ListboxFilter, ListboxItem, ListboxRoot } from 'reka-ui'
import { type Ref, markRaw, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { computedAsync, debouncedWatch } from '@vueuse/core'
import { LRUCache } from '../functions/cache'
import { Icon } from '@iconify/vue'

const emits = defineEmits<{
  close: []
}>()

const { localeIndex, theme } = useData()

const filterText = ref('')
const enableNoResults = ref(false)
const resultsEl = shallowRef<HTMLElement>()
const searchIndexData = shallowRef()
const results: Ref<(SearchResult & Result)[]> = shallowRef([])
const listboxRef = ref<GenericComponentInstance<typeof ListboxRoot>>()

interface Result {
  title: string
  titles: string[]
  text?: string
}

onMounted(() => {
  // @ts-expect-error internal function
  import('@localSearchIndex').then((m) => {
    searchIndexData.value = m.default
  })
})

const mark = computedAsync(async () => {
  if (!resultsEl.value)
    return
  return markRaw(new Mark(resultsEl.value))
}, null)

const searchIndex = computedAsync(async () =>
  markRaw(
    MiniSearch.loadJSON<Result>(
      (await searchIndexData.value[localeIndex.value]?.())?.default,
      {
        fields: ['title', 'titles', 'text'],
        storeFields: ['title', 'titles'],
        searchOptions: {
          fuzzy: 0.2,
          prefix: true,
          boost: { title: 4, text: 2, titles: 1 },
        },
      },
    ),
  ),
)

const cache = new LRUCache(16) // 16 files

debouncedWatch(
  () => [searchIndex.value, filterText.value] as const,
  async ([index, filterTextValue], old, onCleanup) => {
    if (old?.[0] !== index) {
      // in case of hmr
      cache.clear()
    }

    let canceled = false
    onCleanup(() => {
      canceled = true
    })

    if (!index)
      return

    // Search
    results.value = index
      .search(filterTextValue)
      .slice(0, 16) as (SearchResult & Result)[]

    if (canceled)
      return

    const terms = new Set<string>()

    results.value = results.value.map((r) => {
      const [id, anchor] = r.id.split('#')
      const map = cache.get(id)
      const text = map?.get(anchor) ?? ''
      for (const term in r.match) {
        terms.add(term)
      }
      return { ...r, text }
    })

    await nextTick()
    if (canceled)
      return

    await new Promise((r) => {
      mark.value?.unmark({
        done: () => {
          mark.value?.markRegExp(formMarkRegex(terms), { done: r })
        },
      })
    })

    enableNoResults.value = true
    listboxRef.value?.highlightFirstItem()
  },
  { debounce: 200, immediate: true },
)

watch(filterText, () => {
  enableNoResults.value = false
})

function formMarkRegex(terms: Set<string>) {
  return new RegExp(
    [...terms]
      .sort((a, b) => b.length - a.length)
      .map(term => `(${term.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')})`)
      .join('|'),
    'gi',
  )
}
</script>

<template>
  <ListboxRoot ref="listboxRef">
    <div class="w-full px-6 flex items-center">
      <ListboxFilter
        v-model="filterText"
        class="w-full h-12 md:h-14 outline-none bg-transparent placeholder:text-muted-foreground text-sm flex-1"
        :placeholder="theme.search?.options?.translations?.button?.buttonAriaLabel || 'Search documentation'"
        auto-focus
      />
      <DialogClose>
        <Icon icon="lucide:x" />
      </DialogClose>
    </div>

    <ListboxContent
      :ref="(node) => {
        if (node && '$el' in node) {
          resultsEl = node.$el
        }
      }"
      as="ul"
      class="max-h-[55vh] overflow-auto border-t md:border-y border-muted empty:hidden md:empty:block md:empty:border-t-0"
    >
      <ListboxItem
        v-for="p in results"
        :key="p.id"
        :value="p.id"
        class="data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[highlighted]:font-semibold text-muted-foreground text-sm"
        as-child
        @select="emits('close')"
      >
        <a
          :href="p.id"
          class="inline-flex px-6 py-4 w-full"
        >
          <div class="flex items-center flex-wrap">
            <!-- <span>#</span> -->
            <span
              v-for="(t, index) in p.titles"
              :key="index"
              class="flex items-center"
            >
              <span
                class="text"
                v-html="t"
              />
              <Icon
                icon="lucide:chevron-right"
                inline
                class="mx-1 md:mx-2"
              />
            </span>
            <span>
              <span
                class="text"
                v-html="p.title"
              />
            </span>
          </div>
        </a>
      </ListboxItem>

      <li
        v-if="filterText && !results.length && enableNoResults"
        class="flex items-center justify-center text-foreground p-16 text-sm"
      >
        {{ theme.search?.options?.translations?.modal?.noResultsText || 'No results for' }} "<strong>{{ filterText }}</strong>"
      </li>
    </ListboxContent>

    <div class="py-4 px-6 prose prose-stone dark:prose-invert text-sm hidden md:flex items-center gap-4">
      <span class="inline-flex items-center gap-1 leading-4">
        <kbd :aria-label="theme.search?.options?.translations?.modal?.footer.navigateUpKeyAriaLabel || 'Up arrow'">
          <Icon icon="lucide:arrow-up" />
        </kbd>
        <kbd :aria-label="theme.search?.options?.translations?.modal?.footer.navigateDownKeyAriaLabel || 'Down arrow'">
          <Icon icon="lucide:arrow-down" />
        </kbd>
        {{ theme.search?.options?.translations?.modal?.footer?.navigateText || 'to navigate' }}
      </span>
      <span class="inline-flex items-center gap-1 leading-4">
        <kbd aria-label="Enter">
          enter
        </kbd>
        {{ theme.search?.options?.translations?.modal?.footer?.selectText || 'to select' }}
      </span>
      <span class="inline-flex items-center gap-1 leading-4">
        <kbd aria-label="Escape">esc</kbd>
        {{ theme.search?.options?.translations?.modal?.footer?.closeText || 'to close' }}
      </span>
    </div>
  </ListboxRoot>
</template>
