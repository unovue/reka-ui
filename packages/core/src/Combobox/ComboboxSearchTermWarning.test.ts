// #3276: `ComboboxRoot` has no `searchTerm` model (it moved to `ComboboxInput`'s
// `v-model` in v2). Vue passes an unknown `v-model:search-term` through as
// attributes without a word, so the root warns in development.
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '.'

function mountCombobox(root: string, input = '') {
  const search = ref('')
  const wrapper = mount(defineComponent({
    components: { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport },
    setup: () => ({ search, onSearch: (value: string) => { search.value = value } }),
    template: `<ComboboxRoot ${root}>
  <ComboboxAnchor>
    <ComboboxInput data-testid="input" aria-label="Fruit" ${input} />
  </ComboboxAnchor>
  <ComboboxPortal>
    <ComboboxContent>
      <ComboboxViewport>
        <ComboboxItem value="Apple">Apple</ComboboxItem>
        <ComboboxItem value="Banana">Banana</ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</ComboboxRoot>`,
  }), { attachTo: document.body })
  return { wrapper, search }
}

function searchTermWarnings(warn: ReturnType<typeof vi.spyOn>) {
  return warn.mock.calls.filter((call: unknown[]) => typeof call[0] === 'string' && call[0].includes('search-term'))
}

let mounted: ReturnType<typeof mountCombobox> | undefined
afterEach(() => {
  mounted?.wrapper.unmount()
  mounted = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('given a ComboboxRoot bound with the removed search-term model', () => {
  it.each([
    ['v-model:search-term', 'v-model:search-term="search"'],
    ['v-model:searchTerm', 'v-model:searchTerm="search"'],
    ['a search-term prop alone', ':search-term="search"'],
    ['an update:search-term listener alone', '@update:search-term="onSearch"'],
    ['an update:searchTerm listener alone', '@update:searchTerm="onSearch"'],
  ])('warns for %s and points at the input', (_, binding) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mounted = mountCombobox(binding)

    const warnings = searchTermWarnings(warn)
    expect(warnings).toHaveLength(1)
    expect(warnings[0][0]).toContain('[reka-ui] ComboboxRoot')
    expect(warnings[0][0]).toContain('ComboboxInput')
  })

  it('stays silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mounted = mountCombobox('v-model:search-term="search"')

    expect(searchTermWarnings(warn)).toHaveLength(0)
  })
})

describe('given a ComboboxInput bound with v-model', () => {
  it('does not warn, and the bound text follows typing and is shown by the input', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mounted = mountCombobox('', 'v-model="search"')
    const input = mounted.wrapper.find('[data-testid=input]')

    await input.setValue('Ban')
    await flushPromises()
    await nextTick()
    expect(mounted.search.value).toBe('Ban')
    expect(Array.from(document.querySelectorAll('[role=option]')).map(el => el.textContent)).toEqual(['Banana'])

    mounted.search.value = 'App'
    await flushPromises()
    await nextTick()
    // Text set from outside shows in the input; as in v2, only typing filters.
    expect((input.element as HTMLInputElement).value).toBe('App')

    expect(searchTermWarnings(warn)).toHaveLength(0)
  })
})
