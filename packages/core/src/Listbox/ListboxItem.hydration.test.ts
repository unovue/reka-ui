import { renderToString } from '@vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'

// SSR + hydration of ListboxItem slot content (default, scoped, as-child),
// then an update of what the slot reads after hydration.
const label = ref('Apple')
const Child = defineComponent({ props: { t: String }, setup: p => () => h('em', p.t) })
const Fixture = defineComponent({
  components: { ListboxRoot, ListboxContent, ListboxItem, Child },
  setup: () => ({ label }),
  template: `<ListboxRoot><ListboxContent>
    <ListboxItem value="a">{{ label }}<Child :t="label" /></ListboxItem>
    <ListboxItem value="b" v-slot="{ selected }">B{{ selected ? '+' : '-' }}</ListboxItem>
    <ListboxItem value="c" as-child><li>{{ label }}</li></ListboxItem>
  </ListboxContent></ListboxRoot>`,
})

describe('listboxItem hydration', () => {
  it('hydrates without mismatch and updates afterwards', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Fixture))
    document.body.innerHTML = ''
    document.body.append(container)
    const before = container.innerHTML
    createSSRApp(Fixture).mount(container)
    await nextTick()
    const msgs = [...warn.mock.calls, ...error.mock.calls].flat().map(String).filter(m => /ydration/.test(m))
    label.value = 'Apricot'
    await nextTick()
    const texts = Array.from(container.querySelectorAll('[role=option]'), o => o.textContent)
    warn.mockRestore()
    error.mockRestore()
    expect(before).toContain('Apple')
    expect(msgs).toEqual([])
    expect(texts).toEqual(['ApricotApricot', 'B-', 'Apricot'])
  })
})
