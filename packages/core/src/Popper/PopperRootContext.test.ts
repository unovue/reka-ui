import type { PopperScope } from './PopperRootContext'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import PopperAnchor from './PopperAnchor.vue'
import PopperRoot from './PopperRoot.vue'
import { injectPopperRootContext } from './PopperRootContext'

enableAutoUnmount(afterEach)

function createProbe(scope?: PopperScope) {
  return defineComponent({
    setup() {
      return { anchor: injectPopperRootContext(scope).anchor }
    },
    render: () => null,
  })
}

describe('scoped popper anchors', () => {
  it('keeps an outer family anchor separate from the nearest unscoped anchor', () => {
    const ScopedProbe = createProbe('popover')
    const DefaultProbe = createProbe()
    const wrapper = mount(() => h(PopperRoot, { scope: 'popover' }, () =>
      h(PopperRoot, null, () => [
        h(PopperAnchor, { 'scope': 'popover', 'data-testid': 'outer' }),
        h(PopperAnchor, { 'data-testid': 'inner' }),
        h(ScopedProbe),
        h(DefaultProbe),
      ])), { attachTo: document.body })

    expect(wrapper.findComponent(ScopedProbe).vm.anchor).toBe(wrapper.get('[data-testid="outer"]').element)
    expect(wrapper.findComponent(DefaultProbe).vm.anchor).toBe(wrapper.get('[data-testid="inner"]').element)
  })

  it('uses the nearest root of the same family through another floating family', () => {
    const OuterProbe = createProbe('menu')
    const InnerProbe = createProbe('menu')
    const wrapper = mount(() => h(PopperRoot, { scope: 'menu' }, () => [
      h(PopperAnchor, { 'scope': 'menu', 'data-testid': 'outer' }),
      h(OuterProbe),
      h(PopperRoot, { scope: 'menu' }, () => h(PopperRoot, { scope: 'tooltip' }, () => [
        h(PopperAnchor, { 'scope': 'menu', 'data-testid': 'inner' }),
        h(InnerProbe),
      ])),
    ]), { attachTo: document.body })

    expect(wrapper.findComponent(OuterProbe).vm.anchor).toBe(wrapper.get('[data-testid="outer"]').element)
    expect(wrapper.findComponent(InnerProbe).vm.anchor).toBe(wrapper.get('[data-testid="inner"]').element)
  })

  it('does not share anchors between independent roots of the same family', () => {
    const FirstProbe = createProbe('popover')
    const SecondProbe = createProbe('popover')
    const wrapper = mount(() => h('div', [
      h(PopperRoot, { scope: 'popover' }, () => [
        h(PopperAnchor, { 'scope': 'popover', 'data-testid': 'first' }),
        h(FirstProbe),
      ]),
      h(PopperRoot, { scope: 'popover' }, () => [
        h(PopperAnchor, { 'scope': 'popover', 'data-testid': 'second' }),
        h(SecondProbe),
      ]),
    ]), { attachTo: document.body })

    expect(wrapper.findComponent(FirstProbe).vm.anchor).toBe(wrapper.get('[data-testid="first"]').element)
    expect(wrapper.findComponent(SecondProbe).vm.anchor).toBe(wrapper.get('[data-testid="second"]').element)
  })
})
