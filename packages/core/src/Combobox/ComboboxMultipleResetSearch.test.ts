// #2151: as Base UI's Combobox, selecting an item while filtering a `multiple`
// combobox clears the typed text and the filter (the popup stays open), unless
// `resetSearchTermOnSelect` is `false` or the input text change is cancelled.
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

function mountCombobox(rootProps: Record<string, unknown> = {}, onBeforeText?: (...args: any[]) => void) {
  return mount(defineComponent({
    components: { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport },
    setup: () => ({ rootProps, onBeforeText: onBeforeText ?? (() => {}) }),
    template: `<ComboboxRoot multiple v-bind="rootProps">
  <ComboboxAnchor>
    <ComboboxInput data-testid="input" aria-label="Fruit" @before-update:model-value="onBeforeText" />
    <ComboboxTrigger data-testid="trigger">Open</ComboboxTrigger>
  </ComboboxAnchor>
  <ComboboxPortal>
    <ComboboxContent>
      <ComboboxViewport>
        <ComboboxItem value="Apple">Apple</ComboboxItem>
        <ComboboxItem value="Apricot">Apricot</ComboboxItem>
        <ComboboxItem value="Banana">Banana</ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</ComboboxRoot>`,
  }), { attachTo: document.body })
}

const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role=option]')).map(el => el.textContent)

async function typeAp(wrapper: ReturnType<typeof mountCombobox>) {
  await wrapper.find('[data-testid=input]').setValue('Ap')
  await flushPromises()
  await nextTick()
  expect(options()).toEqual(['Apple', 'Apricot'])
}

let wrapper: ReturnType<typeof mountCombobox> | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('given a multiple Combobox filtered by typed text', () => {
  it('clears the text and the filter after an item press, keeping the popup open', async () => {
    wrapper = mountCombobox()
    await typeAp(wrapper)
    const input = wrapper.find('[data-testid=input]').element as HTMLInputElement

    document.querySelector<HTMLElement>('[role=option]')!.click()
    await flushPromises()

    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['Apple'])
    expect(input.value).toBe('')
    expect(wrapper.findComponent(ComboboxInput).emitted<[string, { reason: string }]>('update:modelValue')?.at(-1)?.[1].reason).toBe('input-clear')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(options()).toEqual(['Apple', 'Apricot', 'Banana'])
  })

  it('clears the text and the filter after selecting with Enter', async () => {
    wrapper = mountCombobox()
    await typeAp(wrapper)
    const input = wrapper.find('[data-testid=input]')

    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['Apple'])
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(options()).toEqual(['Apple', 'Apricot', 'Banana'])
  })

  it('keeps the text and the filter with `resetSearchTermOnSelect: false`', async () => {
    wrapper = mountCombobox({ resetSearchTermOnSelect: false })
    await typeAp(wrapper)

    document.querySelector<HTMLElement>('[role=option]')!.click()
    await flushPromises()

    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['Apple'])
    expect((wrapper.find('[data-testid=input]').element as HTMLInputElement).value).toBe('Ap')
    expect(options()).toEqual(['Apple', 'Apricot'])
  })

  it('keeps the text and the filter when the clear is cancelled', async () => {
    const onBeforeText = vi.fn((_value: string, details: { reason: string, cancel: () => void }) => {
      if (details.reason === 'input-clear')
        details.cancel()
    })
    wrapper = mountCombobox({}, onBeforeText)
    await typeAp(wrapper)

    document.querySelector<HTMLElement>('[role=option]')!.click()
    await flushPromises()

    expect(onBeforeText).toHaveBeenCalledWith('', expect.objectContaining({ reason: 'input-clear' }))
    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['Apple'])
    expect((wrapper.find('[data-testid=input]').element as HTMLInputElement).value).toBe('Ap')
    expect(options()).toEqual(['Apple', 'Apricot'])
  })
})

describe('given a multiple Combobox with a controlled input text', () => {
  it('clears a filter left behind when the parent already emptied the text', async () => {
    const text = ref('')
    wrapper = mount(defineComponent({
      components: { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport },
      setup: () => ({ text }),
      template: `<ComboboxRoot multiple>
  <ComboboxAnchor>
    <ComboboxInput v-model="text" data-testid="input" aria-label="Fruit" />
  </ComboboxAnchor>
  <ComboboxPortal>
    <ComboboxContent>
      <ComboboxViewport>
        <ComboboxItem value="Apple">Apple</ComboboxItem>
        <ComboboxItem value="Apricot">Apricot</ComboboxItem>
        <ComboboxItem value="Banana">Banana</ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</ComboboxRoot>`,
    }), { attachTo: document.body }) as unknown as ReturnType<typeof mountCombobox>
    await typeAp(wrapper)
    // The parent resets its text; the filter still holds the typed one.
    text.value = ''
    await flushPromises()
    expect(options()).toEqual(['Apple', 'Apricot'])

    document.querySelector<HTMLElement>('[role=option]')!.click()
    await flushPromises()

    expect(text.value).toBe('')
    expect(options()).toEqual(['Apple', 'Apricot', 'Banana'])
  })
})
