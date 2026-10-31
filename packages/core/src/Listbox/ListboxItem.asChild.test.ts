import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'

// An `as-child` item (or one whose `as` is a component) renders its slot
// inside `Slot`'s (or that component's) render, not its own: what the slot
// reads must still reach the DOM, also when a state change and a slot-data
// change land in the same tick.

async function settle() {
  await nextTick()
  await new Promise(r => setTimeout(r))
  await nextTick()
}

function setup() {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  const label = ref('Apple')
  const w = mount(defineComponent({
    components: { ListboxRoot, ListboxContent, ListboxItem },
    setup: () => ({ label }),
    template: `<ListboxRoot><ListboxContent>
      <ListboxItem value="c" as-child><li>{{ label }}</li></ListboxItem>
    </ListboxContent></ListboxRoot>`,
  }), { attachTo: document.body })
  return { w, label, text: () => w.find('li').text() }
}

describe('as-child ListboxItem slot updates', () => {
  it('updates on every change after the list settled', async () => {
    const { w, label, text } = setup()
    await settle()
    const seen: string[] = []
    for (const next of ['Apricot', 'Banana', 'Cherry']) {
      label.value = next
      await settle()
      seen.push(text())
    }
    expect(seen).toEqual(['Apricot', 'Banana', 'Cherry'])
    w.unmount()
  })

  it('updates after a selection and a slot-data change landed in the same tick', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    const label = ref('Apple')
    const model = ref<string>()
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ label, model }),
      template: `<ListboxRoot v-model="model"><ListboxContent>
        <ListboxItem value="a" as-child><li>{{ label }}{{ model === 'a' ? ' (picked)' : '' }}</li></ListboxItem>
        <ListboxItem value="b" as-child><li>B</li></ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    // Selecting the item flips its state and changes what its slot reads, together.
    await w.findAll('li')[0].trigger('click')
    await settle()
    expect(w.findAll('li')[0].text()).toBe('Apple (picked)')
    // A later change only the slot reads.
    label.value = 'Apricot'
    await settle()
    expect(w.findAll('li')[0].text()).toBe('Apricot (picked)')
    w.unmount()
  })

  it('same with `as` set to a component (its slot renders in that component)', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    const Row = defineComponent({ template: '<li v-bind="$attrs"><slot /></li>', inheritAttrs: false })
    const label = ref('Apple')
    const model = ref<string>()
    const w = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ label, model, Row }),
      template: `<ListboxRoot v-model="model"><ListboxContent>
        <ListboxItem value="a" :as="Row">{{ label }}{{ model === 'a' ? ' (picked)' : '' }}</ListboxItem>
      </ListboxContent></ListboxRoot>`,
    }), { attachTo: document.body })
    await settle()
    await w.find('li').trigger('click')
    await settle()
    expect(w.find('li').text()).toBe('Apple (picked)')
    label.value = 'Apricot'
    await settle()
    expect(w.find('li').text()).toBe('Apricot (picked)')
    w.unmount()
  })

  it('updates on every change when the first change lands before the mount settles', async () => {
    const { w, label, text } = setup()
    await nextTick()
    const seen: string[] = []
    for (const next of ['Apricot', 'Banana', 'Cherry']) {
      label.value = next
      await settle()
      seen.push(text())
    }
    expect(seen).toEqual(['Apricot', 'Banana', 'Cherry'])
    w.unmount()
  })
})
