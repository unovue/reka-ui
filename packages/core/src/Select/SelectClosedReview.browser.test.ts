// Regression (#3111 review): what a refetch writes, when a key renders, what a consumer's own nodes cost, a
// remembered `disabled`, and items outside the fragment. Real Chromium.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, defineAsyncComponent, defineComponent, h, KeepAlive, nextTick, onMounted, onUnmounted, ref, shallowRef, Teleport } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

let app: ReturnType<typeof createApp> | undefined
let host: HTMLElement | undefined
let mounts = 0
const Probe = defineComponent({
  setup() {
    onMounted(() => mounts++)
    onUnmounted(() => {})
    return () => null
  },
})

afterEach(() => {
  vi.restoreAllMocks()
  app?.unmount()
  host?.remove()
  app = undefined
  mounts = 0
  document.body.innerHTML = ''
})

const wait = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms))
const trigger = () => document.getElementById('trigger') as HTMLElement
const value = () => document.getElementById('value')?.textContent?.trim()
const native = () => document.querySelector('select') as HTMLSelectElement
const options = () => Array.from(native().options).filter(option => !option.hasAttribute('data-nullable'))
const optionTexts = () => options().map(option => option.textContent!.trim())

function item(text: string, itemValue: unknown = text, disabled = false) {
  return h(SelectItem, { key: text, value: itemValue, disabled } as any, () => [h(SelectItemText, () => text), h(Probe)])
}

function mountSelect(content: () => unknown, root: () => Record<string, unknown> = () => ({}), { form = false } = {}) {
  const log: unknown[] = []
  host = document.createElement('div')
  document.body.appendChild(host)
  const model = ref<unknown>()
  app = createApp(defineComponent({ setup: () => () => h(form ? 'form' : 'div', [
    h(SelectRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: unknown) => {
      log.push(v)
      model.value = v
    }, ...root() } as any, () => [
      h(SelectTrigger, { 'id': 'trigger', 'aria-label': 'x' }, () => h(SelectValue, { id: 'value', placeholder: 'Pick' })),
      h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, content as any))),
    ]),
    h('button', { id: 'after', type: 'button' }, 'after'),
  ]) }))
  app.mount(host)
  return { log, model }
}

async function openAndClose() {
  trigger().focus()
  await userEvent.keyboard('{ArrowDown}')
  await wait(150)
  await userEvent.keyboard('{Escape}')
  await wait(150)
}

function autofill(index: number) {
  options()[index].selected = true
  native().dispatchEvent(new Event('input', { bubbles: true }))
  native().dispatchEvent(new Event('change', { bubbles: true }))
}

/** Counts the document-order work while `run` runs. */
async function countCompares(run: () => Promise<void>) {
  const proto = Node.prototype
  const real = proto.compareDocumentPosition
  let compares = 0
  proto.compareDocumentPosition = function (this: Node, other: Node) {
    compares++
    return real.call(this, other)
  }
  try {
    await run()
  }
  finally {
    proto.compareDocumentPosition = real
  }
  return compares
}

const data = (labels: string[]) => labels.map(label => ({ value: label, label }))

describe('a refetch with `by`: the latest object is written', () => {
  const label: Record<number, string> = { 1: 'Apple', 2: 'Banana' }
  const objects = (rev: number) => [1, 2].map(id => ({ id, rev }))

  for (const [name, by] of [['a key', 'id'], ['a function', (a: any, b: any) => a?.id === b?.id]] as const) {
    it(`${name}, \`items\`, closed and unrendered: the typeahead`, async () => {
      const list = shallowRef(objects(1))
      const { log } = mountSelect(
        () => list.value.map(o => item(label[o.id], o)),
        () => ({ by, items: list.value.map(o => ({ value: o, label: label[o.id] })) }),
      )
      await nextTick()
      await openAndClose()
      list.value = objects(2)
      await wait()
      trigger().focus()
      await userEvent.keyboard('b')
      await wait()
      expect(log.at(-1)).toEqual({ id: 2, rev: 2 })
    })

    it(`${name}, \`items\`, a named Select: autofill`, async () => {
      const list = shallowRef(objects(1))
      const { log } = mountSelect(
        () => list.value.map(o => item(label[o.id], o)),
        () => ({ by, name: 'n', items: list.value.map(o => ({ value: o, label: label[o.id] })) }),
        { form: true },
      )
      await wait(700)
      list.value = objects(2)
      await wait()
      autofill(1)
      await wait()
      expect(log.at(-1)).toEqual({ id: 2, rev: 2 })
    })

    it(`${name}, no \`items\`, a named Select: autofill`, async () => {
      const list = shallowRef(objects(1))
      const { log } = mountSelect(() => list.value.map(o => item(label[o.id], o)), () => ({ by, name: 'n' }), { form: true })
      await wait()
      list.value = objects(2)
      await wait()
      autofill(1)
      await wait()
      expect(log.at(-1)).toEqual({ id: 2, rev: 2 })
    })
  }
})

describe('which keys render the items', () => {
  const labels = ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry']

  it('a jump back to another letter renders nothing', async () => {
    const model = ref<unknown>('Banana')
    mountSelect(() => labels.map(text => item(text)), () => ({ 'items': data(labels), 'modelValue': model.value, 'onUpdate:modelValue': (v: unknown) => {
      model.value = v
    } }))
    await nextTick()
    trigger().focus()
    await userEvent.keyboard('a')
    await wait()
    expect(value()).toBe('Apple')
    expect(mounts).toBe(0)
  })

  it('a longer search the selection still matches renders nothing', async () => {
    mountSelect(() => labels.map(text => item(text)), () => ({ items: data(labels) }))
    await nextTick()
    trigger().focus()
    await userEvent.keyboard('blu')
    await wait()
    expect(value()).toBe('Blueberry')
    expect(mounts).toBe(0)
  })

  it('a repeated key that wraps renders, so a child-only option is reached', async () => {
    const all = ['Apple', 'Apricot', 'Avocado']
    mountSelect(() => all.map(text => item(text)), () => ({ items: data(['Apple', 'Apricot']) }))
    await nextTick()
    trigger().focus()
    const seen: unknown[] = []
    for (let i = 0; i < 4; i++) {
      await userEvent.keyboard('a')
      await wait(20)
      seen.push(value())
    }
    expect(seen).toEqual(['Apple', 'Apricot', 'Avocado', 'Apple'])
    expect(mounts).toBe(3)
  })

  it('a key with no match still renders', async () => {
    const all = ['Apple', 'Cherry']
    mountSelect(() => all.map(text => item(text)), () => ({ items: data(['Apple']) }))
    await nextTick()
    trigger().focus()
    await userEvent.keyboard('c')
    await wait()
    expect(value()).toBe('Cherry')
  })
})

describe('a consumer\'s own nodes next to the lean items', () => {
  const list = Array.from({ length: 50 }, (_, i) => `Option ${i}`)

  it('a live badge inside one item does no document-order work', async () => {
    const count = ref(0)
    mountSelect(() => list.map((text, i) => h(SelectItem, { key: text, value: text }, () => [h(SelectItemText, () => text), i === 3 && count.value % 2 ? h('b', 'new') : null])), () => ({ name: 'n' }), { form: true })
    await wait()
    expect(await countCompares(async () => {
      for (let i = 0; i < 4; i++) {
        count.value++
        await wait(10)
      }
    })).toBe(0)
  })

  it('a node a selected item adds does not make a model change do document-order work', async () => {
    const model = ref<unknown>('Option 0')
    mountSelect(() => list.map(text => h(SelectItem, { key: text, value: text }, { default: ({ selected }: any) => [h(SelectItemText, () => text), selected ? h('i', 'x') : null] } as any)), () => ({ 'name': 'n', 'modelValue': model.value, 'onUpdate:modelValue': (v: unknown) => {
      model.value = v
    } }), { form: true })
    await wait()
    expect(await countCompares(async () => {
      for (let i = 1; i < 5; i++) {
        model.value = `Option ${i}`
        await wait(10)
      }
    })).toBe(0)
  })
})

describe('a `disabled` remembered from an unmounted item', () => {
  const entries = data(['Apple', 'Apricot'])
  const content = (disabled: { value: boolean }) => () => [item('Apple', 'Apple', disabled.value), item('Apricot')]

  it('re-enabled while closed: the key finds it', async () => {
    const disabled = ref(true)
    mountSelect(content(disabled), () => ({ items: entries }))
    await nextTick()
    await openAndClose()
    document.getElementById('after')!.focus()
    await wait()
    disabled.value = false
    await wait()
    trigger().focus()
    await userEvent.keyboard('a')
    await wait()
    expect(value()).toBe('Apple')
  })

  it('still disabled: the key skips it', async () => {
    const disabled = ref(true)
    mountSelect(content(disabled), () => ({ items: entries }))
    await nextTick()
    await openAndClose()
    document.getElementById('after')!.focus()
    await wait()
    trigger().focus()
    await userEvent.keyboard('a')
    await wait()
    expect(value()).toBe('Apricot')
  })

  it('a key that does not depend on it renders nothing', async () => {
    const all = ['Apple', 'Banana']
    mountSelect(() => [item('Apple', 'Apple', true), item('Banana')], () => ({ items: data(all) }))
    await nextTick()
    await openAndClose()
    document.getElementById('after')!.focus()
    await wait()
    const before = mounts
    trigger().focus()
    await userEvent.keyboard('b')
    await wait()
    expect(value()).toBe('Banana')
    expect(mounts).toBe(before)
  })

  it('removed from the template while `items` keeps it: rendered items decide, so `items` does', async () => {
    const show = ref(true)
    const { log } = mountSelect(() => [show.value ? item('Apple', 'Apple', true) : null, item('Apricot')], () => ({ items: entries }))
    await nextTick()
    await openAndClose()
    show.value = false
    document.getElementById('after')!.focus()
    await wait()
    trigger().focus()
    await userEvent.keyboard('a')
    await wait()
    // Rendered items come first, then what only `items` lists.
    expect(log.at(-1)).toBe('Apricot')
    await userEvent.keyboard('a')
    await wait()
    expect(log.at(-1)).toBe('Apple')
  })
})

describe('items outside the fragment', () => {
  const RealObserver = globalThis.MutationObserver
  afterEach(() => {
    globalThis.MutationObserver = RealObserver
  })

  /** Records what the observers watch, and with which options. */
  function spyObservers() {
    const targets: Array<{ target: Node, options?: MutationObserverInit }> = []
    let fired = 0
    globalThis.MutationObserver = class extends RealObserver {
      constructor(callback: MutationCallback) {
        super((records, observer) => {
          fired++
          callback(records, observer)
        })
      }

      observe(target: Node, options?: MutationObserverInit) {
        targets.push({ target, options })
        super.observe(target, options)
      }
    }
    return { targets, fired: () => fired }
  }

  function shadowOption() {
    return defineComponent({
      setup(_props, { slots }) {
        const element = ref<HTMLElement>()
        const root = shallowRef<ShadowRoot>()
        onMounted(() => {
          root.value = element.value!.attachShadow({ mode: 'open' })
        })
        return () => h('div', { ref: element }, root.value ? [h(Teleport, { to: root.value }, slots.default!())] : [])
      },
    })
  }

  it('each option in its own shadow root: a text change of any of them arrives', async () => {
    const Shadow = shadowOption()
    const text = ref('B1')
    mountSelect(() => [
      h(Shadow, { key: 'a' }, () => h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => 'A1'))),
      h(Shadow, { key: 'b' }, () => h(SelectItem, { value: 'b' }, () => h(SelectItemText, () => text.value))),
    ], () => ({ name: 'n' }), { form: true })
    await wait(60)
    text.value = 'B2'
    await wait(60)
    expect(optionTexts().sort()).toEqual(['A1', 'B2'])
  })

  it('a KeepAlive branch switch: text changes and reorders of the new branch arrive', async () => {
    const tab = shallowRef('a')
    const text = ref('T')
    const list = ref(['X', 'Y'])
    const A = defineComponent({ name: 'A', setup: () => () => h('div', [h(SelectItem, { value: 'A' }, () => h(SelectItemText, () => 'A'))]) })
    const B = defineComponent({ name: 'B', setup: () => () => h('div', list.value.map(v => h(SelectItem, { key: v, value: v }, () => h(SelectItemText, () => `${v}${text.value}`)))) })
    mountSelect(() => h(KeepAlive, () => h(tab.value === 'a' ? A : B)), () => ({ name: 'n' }), { form: true })
    await wait()
    tab.value = 'b'
    await wait()
    text.value = 'U'
    await wait()
    expect(optionTexts()).toContain('XU')
    list.value = ['Y', 'X']
    await wait()
    expect(optionTexts().indexOf('YU')).toBeLessThan(optionTexts().indexOf('XU'))
  })

  it('a first option teleported into the page: the observer watches its box, and page mutations do not fire it', async () => {
    const spy = spyObservers()
    const box = document.createElement('div')
    box.id = 'box'
    document.body.appendChild(box)
    const text = ref('T')
    mountSelect(() => [
      h(Teleport, { to: '#box' }, h(SelectItem, { value: 'A' }, () => h(SelectItemText, () => `A${text.value}`))),
      h(SelectItem, { value: 'B' }, () => h(SelectItemText, () => `B${text.value}`)),
    ], () => ({ name: 'n' }), { form: true })
    await wait(60)
    expect(spy.targets.some(({ target }) => target === document)).toBe(false)
    const fired = spy.fired()
    for (let i = 0; i < 3; i++) {
      document.body.appendChild(document.createElement('div'))
      await wait(5)
    }
    expect(spy.fired()).toBe(fired)
    text.value = 'U'
    await wait(60)
    expect(optionTexts().sort()).toEqual(['AU', 'BU'])
    box.remove()
  })

  it('options teleported straight to the body: no observer watches the page\'s subtree, and text and reorders arrive', async () => {
    const spy = spyObservers()
    const text = ref('T')
    const list = ref(['A', 'B'])
    mountSelect(() => h(Teleport, { to: 'body' }, list.value.map(v => h(SelectItem, { key: v, value: v }, () => h(SelectItemText, () => `${v}${text.value}`)))), () => ({ name: 'n' }), { form: true })
    await wait(60)
    const wide = spy.targets.filter(({ target, options }) => options?.subtree && (target === document || target === document.documentElement || target === document.body))
    expect(wide).toEqual([])
    text.value = 'U'
    await wait(60)
    expect(optionTexts().sort()).toEqual(['AU', 'BU'])
    list.value = ['B', 'A']
    await wait(60)
    expect(optionTexts()).toEqual(['BU', 'AU'])
  })
})

describe('a new element for an item or its text', () => {
  it('a dynamic `as` on an item: its later moves arrive', async () => {
    const tag = ref('div')
    const list = ref(['A', 'B', 'C'])
    mountSelect(() => list.value.map(v => h(SelectItem, { key: v, value: v, as: v === 'A' ? tag.value : 'div' } as any, () => h(SelectItemText, () => v))), () => ({ name: 'n' }), { form: true })
    await wait()
    tag.value = 'section'
    await wait()
    // Only A moves: B and C keep their relative order.
    list.value = ['B', 'C', 'A']
    await wait()
    expect(optionTexts()).toEqual(['B', 'C', 'A'])
  })

  it('a dynamic `as` on an item text: its later text changes arrive', async () => {
    const tag = ref('span')
    const text = shallowRef<HTMLElement>()
    const { log } = mountSelect(() => h(SelectItem, { value: 'a' }, () => h(SelectItemText, { as: tag.value, ref: (el: any) => {
      text.value = el?.$el
    } } as any, () => 'Old')), () => ({ name: 'n' }), { form: true })
    await wait()
    tag.value = 'em'
    await wait()
    text.value!.textContent = 'New'
    await wait()
    expect(optionTexts()).toEqual(['New'])
    trigger().focus()
    await userEvent.keyboard('n')
    await wait()
    expect(log).toEqual(['a'])
  })
})

describe('a move out of the watched tree', () => {
  /** Text that re-renders on its own: its item's and text's parents don't update. */
  const selfUpdating = (text: { value: string }) => defineComponent({ setup: () => () => h('b', text.value) })

  it('a KeepAlive branch, selected and not the first item: its text stays live while deactivated and after', async () => {
    const branch = ref('s')
    const text = ref('Self')
    const Self = selfUpdating(text)
    const S = defineComponent({ name: 'S', setup: () => () => h('div', h(SelectItem, { value: 's' }, () => h(SelectItemText, () => h(Self)))) })
    const Y = defineComponent({ name: 'Y', setup: () => () => h('div', h(SelectItem, { value: 'y' }, () => h(SelectItemText, () => 'Yak'))) })
    const model = ref<unknown>('s')
    mountSelect(() => [item('First'), h(KeepAlive, () => h(branch.value === 's' ? S : Y)), item('Last')], () => ({ 'name': 'n', 'modelValue': model.value, 'onUpdate:modelValue': (v: unknown) => {
      model.value = v
    } }), { form: true })
    await wait()
    branch.value = 'y'
    await wait()
    text.value = 'Changed'
    await wait()
    expect(value()).toBe('Changed')
    branch.value = 's'
    await wait()
    expect(value()).toBe('Changed')
    expect(optionTexts()).toContain('Changed')
    text.value = 'Again'
    await wait()
    expect(value()).toBe('Again')
  })

  it('`Teleport` `disabled` toggled while closed: self-updating text follows', async () => {
    const box = document.createElement('div')
    document.body.append(box)
    const disabled = ref(true)
    const text = ref('A')
    const Self = selfUpdating(text)
    mountSelect(() => [item('First'), item('Second'), h(Teleport, { to: box, disabled: disabled.value }, [h(SelectItem, { key: 'a', value: 'a' }, () => h(SelectItemText, () => h(Self)))])], () => ({ name: 'n' }), { form: true })
    await wait()
    disabled.value = false
    await wait()
    text.value = 'Az'
    await wait()
    expect(optionTexts()).toContain('Az')
    box.remove()
  })

  it('a wrapper moved to the page by hand: self-updating text follows', async () => {
    const box = document.createElement('div')
    document.body.append(box)
    const text = ref('A')
    const Self = selfUpdating(text)
    let wrapper: HTMLElement | undefined
    mountSelect(() => [item('First'), item('Second'), h('div', { key: 'w', ref: (el: any) => {
      if (el)
        wrapper = el
    } }, h(SelectItem, { value: 'a' }, () => h(SelectItemText, () => h(Self))))], () => ({ name: 'n' }), { form: true })
    await wait()
    box.appendChild(wrapper!)
    await wait()
    text.value = 'Az'
    await wait()
    expect(optionTexts()).toContain('Az')
    box.remove()
  })
})

describe('a search armed for late items', () => {
  const SEARCH_RESET = 1100

  it('focus leaving ends it: a sticky option no longer in the template is not selected', async () => {
    const list = ref(['Apple', 'Zebra'])
    const { log } = mountSelect(() => list.value.map(text => item(text)))
    await nextTick()
    trigger().focus()
    await userEvent.keyboard('q')
    await wait()
    document.getElementById('after')!.focus()
    await wait(SEARCH_RESET)
    list.value = ['Apple', 'Yak']
    await wait()
    trigger().focus()
    await userEvent.keyboard('z')
    await wait()
    expect(log).toEqual([])
    document.getElementById('after')!.focus()
    await wait(200)
    expect(log).toEqual([])
    expect(value()).toBe('Pick')
  })

  it('a key and a blur in the same task: nothing matches once the items are released', async () => {
    const { log } = mountSelect(() => ['Apple', 'Zebra'].map(text => item(text)))
    await nextTick()
    await openAndClose()
    trigger().focus()
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }))
    document.getElementById('after')!.focus()
    await wait(200)
    expect(log).toEqual([])
  })
})

describe('values with a field that can\'t be serialized, under `by`', () => {
  it('a refetch raises nothing, and a named Select writes the latest object', async () => {
    const make = () => [1, 2].map(id => ({ id, name: `N${id}`, blob: new Blob(['x']) }))
    const list = shallowRef(make())
    const errors: unknown[] = []
    const { log } = mountSelect(() => list.value.map(o => item(o.name, o)), () => ({ by: 'id', name: 'n' }), { form: true })
    app!.config.errorHandler = error => errors.push(error)
    await wait()
    const latest = make()
    list.value = latest
    await wait()
    expect(errors).toEqual([])
    autofill(1)
    await wait()
    expect(log.at(-1)).toEqual(latest[1])
  })
})

describe('an as-child text with no element for a while', () => {
  const asChildItem = (content: () => unknown) => h(SelectItem, { key: 'a', value: 'a' }, () => h(SelectItemText, { asChild: true }, content as any))
  const named = () => ({ name: 'n', modelValue: 'a' })

  /** The observers created while `run` runs, and how many are live once the Select unmounts. */
  async function liveAfterUnmount(run: () => Promise<void>) {
    const Real = globalThis.MutationObserver
    const created: { live: boolean }[] = []
    globalThis.MutationObserver = class extends Real {
      state = { live: false }
      constructor(callback: MutationCallback) {
        super(callback)
        created.push(this.state)
      }

      override observe(target: Node, options?: MutationObserverInit) {
        this.state.live = true
        super.observe(target, options)
      }

      override disconnect() {
        this.state.live = false
        super.disconnect()
      }
    }
    try {
      await run()
      app!.unmount()
      app = undefined
      await wait()
      return created.filter(state => state.live).length
    }
    finally {
      globalThis.MutationObserver = Real
    }
  }

  it('absent at the mount, then there: its label registers and stays live', async () => {
    const show = ref(false)
    const text = ref('A1')
    mountSelect(() => [asChildItem(() => show.value ? h('span', text.value) : null), item('B')], named, { form: true })
    await wait()
    expect(value()).toBe('Pick')
    show.value = true
    await wait()
    expect(value()).toBe('A1')
    expect(optionTexts()).toContain('A1')
    text.value = 'A2'
    await wait()
    expect(value()).toBe('A2')
  })

  it('around an async component: its label registers once it resolves', async () => {
    const Lazy = defineAsyncComponent({ loader: () => new Promise<any>(resolve => setTimeout(() => resolve(defineComponent({ setup: () => () => h('span', 'Loaded') })), 60)) })
    mountSelect(() => [asChildItem(() => h(Lazy)), item('B')], named, { form: true })
    await wait(200)
    expect(value()).toBe('Loaded')
    expect(optionTexts()).toContain('Loaded')
  })

  it('gone, then back with a new text, then changed: each one reaches the trigger', async () => {
    const show = ref(true)
    const text = ref('A1')
    mountSelect(() => [asChildItem(() => show.value ? h('span', text.value) : null), item('B')], named, { form: true })
    await wait()
    show.value = false
    await wait()
    expect(value()).toBe('A1')
    text.value = 'A2'
    show.value = true
    await wait()
    expect(value()).toBe('A2')
    text.value = 'A3'
    await wait()
    expect(value()).toBe('A3')
  })

  it('gone when the Select unmounts: no observer stays live', async () => {
    const show = ref(true)
    expect(await liveAfterUnmount(async () => {
      mountSelect(() => [asChildItem(() => show.value ? h('span', 'A1') : null)], named, { form: true })
      await wait()
      show.value = false
      await wait()
    })).toBe(0)
  })

  it('still absent when the Select unmounts: no observer stays live', async () => {
    expect(await liveAfterUnmount(async () => {
      mountSelect(() => [asChildItem(() => null)], named, { form: true })
      await wait()
    })).toBe(0)
  })

  it('a text with its element from the mount doesn\'t read it beyond the observer: replaced and unmounted in one go', async () => {
    const tag = ref('span')
    expect(await liveAfterUnmount(async () => {
      mountSelect(() => [h(SelectItem, { key: 'a', value: 'a' }, () => h(SelectItemText, { as: tag.value }, () => 'A1'))], named, { form: true })
      await wait()
      tag.value = 'b'
      await nextTick()
    })).toBe(0)
  })
})
