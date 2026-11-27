import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '.'

// Compares the parts with what v2 rendered before the selection was read per tab (the snapshots).
async function tick() {
  await nextTick()
  await nextTick()
  await nextTick()
}
function dump(w: any) {
  const t = w.findAll('[role=tab]').map((o: any) => `${o.text()}:${o.attributes('data-state')}:${o.attributes('aria-selected')}:${o.attributes('tabindex')}`)
  const c = w.findAll('[role=tabpanel]').map((o: any) => `${o.attributes('data-state')}:${o.attributes('hidden') ?? 'shown'}:${o.text()}`)
  return { t, c }
}
function make(model: any, list: any, extra: any = {}, contentExtra: any = {}) {
  return mount(defineComponent({ setup: () => () => h(TabsRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => model.value = v, ...extra }, () => [
    h(TabsList, null, () => list.value.map((v: any, i: number) => h(TabsTrigger, { key: i, value: v }, () => String(v)))),
    ...list.value.map((v: any, i: number) => h(TabsContent, { key: i, value: v, ...contentExtra }, () => `c${String(v)}`)),
  ]) }), { attachTo: document.body })
}

describe('tabs vs v2', () => {
  it('value shapes', async () => {
    const out: any[] = []
    const list = ref<any[]>(['a', 'b', 1, '1', 0, '', null, undefined, Number.NaN, 2, 'a'])
    for (const m of [undefined, 'a', 'b', 1, '1', 0, '', null, Number.NaN, 2, 'zzz', undefined, 'a']) {
      const model = ref<any>(m)
      const w = make(model, list)
      await tick()
      out.push([String(m), dump(w)])
      w.unmount()
    }
    // same list, model changed while mounted
    const model = ref<any>(undefined)
    const w = make(model, list)
    await tick()
    for (const m of ['a', 'b', 1, '1', 0, '', null, Number.NaN, 1, Number.NaN, 2, 'zzz', undefined, 'a', null, 'b']) {
      model.value = m
      await tick()
      out.push([`live ${String(m)}`, dump(w)])
    }
    w.unmount()
    expect(out).toMatchSnapshot()
  })

  it('value changes on mounted parts, add/remove, unmount selected', async () => {
    const out: any[] = []
    const model = ref<any>('b')
    const list = ref<any[]>(['a', 'b', 'c'])
    const w = make(model, list)
    await tick()
    out.push(dump(w))
    list.value = ['b', 'x', 'c']
    await tick()
    out.push(dump(w))
    list.value = ['x', 'y', 'b']
    await tick()
    out.push(dump(w))
    list.value = ['x', 'y']
    await tick()
    out.push(dump(w))
    list.value = ['x', 'y', 'b', 'b']
    await tick()
    out.push(dump(w))
    model.value = 'y'
    await tick()
    out.push(dump(w))
    list.value = ['x', 'b', 'b', 'y']
    await tick()
    out.push(dump(w))
    list.value = []
    await tick()
    out.push(dump(w))
    model.value = 'q'
    list.value = ['p', 'q']
    await tick()
    out.push(dump(w))
    w.unmount()
    expect(out).toMatchSnapshot()
  })

  for (const activationMode of ['automatic', 'manual']) {
    for (const unmountOnHide of [true, false]) {
      for (const forceMount of [false, true]) {
        it(`interaction ${activationMode} unmountOnHide=${unmountOnHide} forceMount=${forceMount}`, async () => {
          const out: any[] = []
          const model = ref<any>(undefined)
          const list = ref<any[]>(['a', 'b', 'c'])
          const w = make(model, list, { activationMode, unmountOnHide }, { forceMount })
          await tick()
          out.push(dump(w), model.value)
          const tabs = w.findAll('[role=tab]')
          await tabs[1].trigger('focus')
          await tick()
          out.push(dump(w), model.value)
          await tabs[1].trigger('keydown', { key: 'ArrowRight' })
          await tick()
          out.push(dump(w), model.value, (document.activeElement as any)?.textContent)
          await tabs[2].trigger('focus')
          await tick()
          out.push(dump(w), model.value)
          await tabs[2].trigger('keydown', { key: 'Enter' })
          await tick()
          out.push(dump(w), model.value)
          await tabs[0].trigger('mousedown', { button: 0 })
          await tick()
          out.push(dump(w), model.value)
          await tabs[0].trigger('focus')
          await tick()
          out.push(dump(w), model.value)
          await tabs[1].trigger('keydown', { key: ' ' })
          await tick()
          out.push(dump(w), model.value)
          w.unmount()
          expect(out).toMatchSnapshot()
        })
      }
    }
  }

  it('uncontrolled default-value and indicator, slot props', async () => {
    const Child = defineComponent({ props: ['modelValue'], setup: p => () => h('i', { class: 'child' }, String(p.modelValue)) })
    const Wrap = defineComponent({ components: { TabsRoot }, template: `<TabsRoot v-slot="sp" default-value="a"><slot v-bind="sp" /></TabsRoot>` })
    const w = mount(defineComponent({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent, TabsIndicator, Child, Wrap },
      template: `<TabsRoot default-value="b" v-slot="sp">
        <b class="kept">{{ sp.modelValue }}</b><Child v-bind="sp" /><u v-if="sp.modelValue === 'c'" class="vif" />
        <TabsList><TabsTrigger v-for="v in ['a','b','c']" :key="v" :value="v">{{ v }}</TabsTrigger></TabsList>
        <TabsContent v-for="v in ['a','b','c']" :key="v" :value="v">c{{ v }}</TabsContent>
      </TabsRoot>
      <Wrap v-slot="{ modelValue }"><em class="fwd">{{ modelValue }}</em><TabsList><TabsTrigger v-for="v in ['a','b','c']" :key="v" :value="v" class="w">{{ v }}</TabsTrigger></TabsList></Wrap>`,
    }), { attachTo: document.body })
    await tick()
    expect([w.find('.kept').text(), w.find('.child').text(), w.find('.vif').exists(), w.find('.fwd').text()]).toEqual(['b', 'b', false, 'a'])
    await w.findAll('[role=tab]')[2].trigger('mousedown', { button: 0 })
    await w.findAll('.w')[1].trigger('mousedown', { button: 0 })
    await tick()
    expect([w.find('.kept').text(), w.find('.vif').exists(), w.find('.fwd').text()]).toEqual(['c', true, 'b'])
    expect(w.find('.child').text()).toBe('c')
    w.unmount()
  })
})
