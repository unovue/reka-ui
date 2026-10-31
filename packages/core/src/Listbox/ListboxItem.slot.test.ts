import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject, nextTick, onMounted, onUnmounted, provide, reactive, ref, shallowRef } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'

// A ListboxItem's slot content follows its slot: what the slot reads, and a
// new slot function from the parent even when the item's state is the same
// (a replaced array with the same keys, a conditional `#default`).

async function settle() {
  await new Promise(resolve => setTimeout(resolve))
  await nextTick()
}

let warn: { mock: { calls: unknown[][] }, mockRestore: () => void }
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})
beforeEach(() => { warn = vi.spyOn(console, 'warn') })
afterEach(() => {
  const msgs = warn.mock.calls.map((c: unknown[]) => String(c[0])).filter((m: string) => !m.includes('Extraneous'))
  warn.mockRestore()
  expect(msgs).toEqual([])
})

const texts = (w: any) => w.findAll('[role=option]').map((o: any) => o.text())

describe('listboxItem slot', () => {
  it('a: v-for over a shallowRef of plain objects replaced with same keys', async () => {
    const items = shallowRef([{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }])
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ items }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem v-for="item in items" :key="item.id" :value="item.id">{{ item.name }}</ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    items.value = [{ id: 1, name: 'Apricot' }, { id: 2, name: 'Blueberry' }]
    await nextTick()
    expect(texts(w)).toEqual(['Apricot', 'Blueberry'])
    w.unmount()
  })

  it('b: v-for over a ref (deep reactive) array replaced by fresh objects with same keys', async () => {
    const items = ref([{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }])
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ items }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem v-for="item in items" :key="item.id" :value="item.id">{{ item.name }}</ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    items.value = [{ id: 1, name: 'Apricot' }, { id: 2, name: 'Blueberry' }]
    await nextTick()
    expect(texts(w)).toEqual(['Apricot', 'Blueberry'])
    w.unmount()
  })

  it('c: index-keyed v-for over strings replaced', async () => {
    const items = ref(['Apple', 'Banana'])
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ items }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem v-for="(item, i) in items" :key="i" :value="item">{{ item }}</ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    items.value = ['Cherry', 'Date']
    await nextTick()
    expect(texts(w)).toEqual(['Cherry', 'Date'])
    w.unmount()
  })

  it('d: scoped slot `selected` follows selection', async () => {
    const model = ref<string>()
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ model }),
      template: `<ListboxRoot v-model="model"><ListboxContent>
        <ListboxItem v-for="v in ['a','b']" :key="v" :value="v" v-slot="{ selected }">{{ v }}{{ selected ? '+' : '-' }}</ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    expect(texts(w)).toEqual(['a-', 'b-'])
    model.value = 'b'
    await nextTick()
    expect(texts(w)).toEqual(['a-', 'b+'])
    model.value = 'a'
    await nextTick()
    expect(texts(w)).toEqual(['a+', 'b-'])
    w.unmount()
  })

  it('e: child component in slot mounts once, updates, injects, unmounts', async () => {
    const mounted = vi.fn()
    const unmounted = vi.fn()
    const setups = vi.fn()
    const Child = defineComponent({
      props: { label: String },
      setup(props) {
        setups()
        const fromParent = inject('k', 'MISSING')
        onMounted(mounted)
        onUnmounted(unmounted)
        return () => h('span', `${props.label}:${fromParent}`)
      },
    })
    const label = ref('x')
    const show = ref(true)
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem, Child },
      setup: () => {
        provide('k', 'P')
        return { label, show }
      },
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem value="a"><Child v-if="show" :label="label" /><i v-else>none</i></ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    expect(texts(w)).toEqual(['x:P'])
    label.value = 'y'
    await nextTick()
    expect(texts(w)).toEqual(['y:P'])
    expect(setups).toHaveBeenCalledTimes(1)
    expect(mounted).toHaveBeenCalledTimes(1)
    show.value = false
    await nextTick()
    expect(texts(w)).toEqual(['none'])
    expect(unmounted).toHaveBeenCalledTimes(1)
    show.value = true
    await nextTick()
    expect(texts(w)).toEqual(['y:P'])
    expect(setups).toHaveBeenCalledTimes(2)
    expect(mounted).toHaveBeenCalledTimes(2)
    w.unmount()
  })

  it('f: asChild item updates its slot', async () => {
    const label = ref('Apple')
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ label }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem value="a" as-child><li>{{ label }}</li></ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    label.value = 'Apricot'
    await nextTick()
    expect(texts(w)).toEqual(['Apricot'])
    w.unmount()
  })

  it('g: item removed in the same tick its slot data changes', async () => {
    const items = reactive([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ items }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem v-for="item in items" :key="item.id" :value="item.id">{{ item.name }}</ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    items[0].name = 'AA'
    items.splice(0, 1)
    await nextTick()
    expect(texts(w)).toEqual(['B'])
    items[0].name = 'BB'
    await nextTick()
    expect(texts(w)).toEqual(['BB'])
    w.unmount()
  })

  it('h: dynamic slot functions (conditional named template)', async () => {
    const mode = ref(true)
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ mode }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem value="a"><template v-if="mode" #default>ONE</template><template v-else #default>TWO</template></ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    expect(texts(w)).toEqual(['ONE'])
    mode.value = false
    await nextTick()
    expect(texts(w)).toEqual(['TWO'])
    w.unmount()
  })

  it('i: slot toggles between content and empty', async () => {
    const on = ref(true)
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ on }),
      template: `<ListboxRoot><ListboxContent>
        <ListboxItem value="a"><b v-if="on">X</b></ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    on.value = false
    await nextTick()
    expect(texts(w)).toEqual([''])
    on.value = true
    await nextTick()
    expect(w.find('[role=option] b').exists()).toBe(true)
    w.unmount()
  })
})
