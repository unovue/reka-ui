import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { TagGroupItem, TagGroupRoot } from '@/TagGroup'

// A consumer `default-current-tab-stop-id` on TagGroupRoot, which holds its
// own tab-stop ref (unset at first): the former wrapper's `v-model` started
// from the default.

function app(attrs: Record<string, unknown>) {
  return defineComponent({
    setup: () => () => h(TagGroupRoot, attrs, () => ['a', 'b', 'c'].map(v => h(TagGroupItem, { value: v }, () => v))),
  })
}
const rows = () => [...document.querySelectorAll<HTMLElement>('[data-reka-collection-item]')]

describe('tagGroupRoot default-current-tab-stop-id', () => {
  it('makes the named row the tab stop before any focus', async () => {
    // Learn the (per-app deterministic) tab stop ids by focusing each row.
    const ids: unknown[] = []
    const probe = mount(app({ 'onUpdate:currentTabStopId': (v: unknown) => ids.push(v) }), { attachTo: document.body })
    await nextTick()
    for (const r of rows()) {
      r.focus()
      await nextTick()
    }
    probe.unmount()
    document.body.innerHTML = ''
    expect(ids.length).toBeGreaterThanOrEqual(3)

    const w = mount(app({ 'default-current-tab-stop-id': ids[1] }), { attachTo: document.body })
    await nextTick()
    await nextTick()
    const tabindexes = rows().map(r => r.getAttribute('tabindex'))
    expect(tabindexes).toEqual(['-1', '0', '-1'])
    w.unmount()
  })
})
