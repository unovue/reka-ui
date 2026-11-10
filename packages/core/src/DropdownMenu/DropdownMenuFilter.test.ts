import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DropdownMenuContent, DropdownMenuFilter, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from '.'
import DropdownMenuWithFilter from './story/_DropdownMenuWithFilter.vue'

describe('given DropdownMenu with Filter', () => {
  let wrapper: VueWrapper<InstanceType<typeof DropdownMenuWithFilter>>

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(DropdownMenuWithFilter, { attachTo: document.body })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('should render trigger button', () => {
    expect(wrapper.find('button').exists()).toBeTruthy()
  })

  describe('after opening the dropdown', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
    })

    it('should render filter input', async () => {
      const filterInput = document.querySelector('[role="searchbox"]')
      expect(filterInput).toBeTruthy()
    })

    it('should have correct type and role attributes', async () => {
      const filterInput = document.querySelector('[role="searchbox"]')
      expect(filterInput?.getAttribute('type')).toBe('text')
      expect(filterInput?.getAttribute('role')).toBe('searchbox')
    })

    it('should update modelValue when typing', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.value = 'New'
      filterInput.dispatchEvent(new Event('input'))
      await nextTick()

      expect(wrapper.vm.filterText).toBe('New')
    })

    it('should filter menu items based on input', async () => {
      // Initially all items should be visible
      let items = document.querySelectorAll('[role="menuitem"]')
      expect(items.length).toBe(4)

      // Type filter
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.value = 'New'
      filterInput.dispatchEvent(new Event('input'))
      await nextTick()

      // Only "New Tab" and "New Window" should be visible
      items = document.querySelectorAll('[role="menuitem"]')
      expect(items.length).toBe(2)
      expect(items[0]?.textContent).toContain('New Tab')
      expect(items[1]?.textContent).toContain('New Window')
    })

    it('should handle ArrowDown key to navigate to items', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.focus()

      // Press ArrowDown
      filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await nextTick()

      const firstItem = document.querySelector('[role="menuitem"]')
      expect(firstItem?.getAttribute('data-highlighted')).toBe('')
    })

    it('should handle ArrowUp key to navigate to last item', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.focus()

      // Press ArrowUp
      filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
      await nextTick()

      const items = [...document.querySelectorAll('[role="menuitem"]')]
      const lastItem = items.at(-1)
      expect(lastItem?.getAttribute('data-highlighted')).toBe('')
    })

    it('should handle Escape key to clear filter when not empty', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.value = 'test'
      filterInput.dispatchEvent(new Event('input'))
      await nextTick()

      expect(wrapper.vm.filterText).toBe('test')

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      filterInput.dispatchEvent(escapeEvent)
      await nextTick()

      expect(wrapper.vm.filterText).toBe('')
    })

    it('should sync aria-activedescendant with highlighted item', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.focus()

      // Press ArrowDown to highlight first item
      filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await nextTick()

      const firstItem = document.querySelector('[role="menuitem"]')
      const activeDescendant = filterInput?.getAttribute('aria-activedescendant')
      expect(activeDescendant).toBe(firstItem?.id)
    })
  })

  describe('with disabled filter', () => {
    beforeEach(async () => {
      wrapper.unmount()
      wrapper = mount(DropdownMenuWithFilter, {
        attachTo: document.body,
        props: {
          disabledFilter: true,
        },
      })
      await wrapper.find('button').trigger('click')
      await nextTick()
    })

    it('should render disabled filter input', async () => {
      const filterInput = document.querySelector('[role="searchbox"]')
      expect(filterInput?.hasAttribute('disabled')).toBe(true)
      expect(filterInput?.getAttribute('data-disabled')).toBe('')
    })
  })

  describe('handle IME composition', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
    })

    it('should not update search during IME composition', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      expect(filterInput).toBeTruthy()

      const baseline = document.querySelectorAll('[role="menuitem"]').length

      filterInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
      filterInput.value = 'xiang'
      filterInput.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      const items = document.querySelectorAll('[role="menuitem"]')
      expect(items.length).toBe(baseline)
    })

    it('should update search after composition ends', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      expect(filterInput).toBeTruthy()

      filterInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
      filterInput.value = 'zzzzz'
      filterInput.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      filterInput.dispatchEvent(new CompositionEvent('compositionend', { data: 'zzzzz', bubbles: true }))
      await nextTick()
      await nextTick()

      const items = document.querySelectorAll('[role="menuitem"]')
      expect(items.length).toBe(0)
    })

    it('should not update search during plain-text composition off Android (desktop Pinyin preedit)', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      const baseline = document.querySelectorAll('[role="menuitem"]').length

      filterInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
      filterInput.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'xiang', bubbles: true }))
      filterInput.value = 'xiang'
      filterInput.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      expect(wrapper.vm.filterText).toBe('')
      expect(document.querySelectorAll('[role="menuitem"]').length).toBe(baseline)
    })

    describe('on Android soft keyboard', () => {
      beforeEach(() => {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
          configurable: true,
        })
      })

      afterEach(() => {
        delete (window.navigator as { userAgent?: string }).userAgent
      })

      it('should update search live during plain-text (autocorrect) composition', async () => {
        const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement

        filterInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
        filterInput.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'New', bubbles: true }))
        filterInput.value = 'New'
        filterInput.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()

        expect(wrapper.vm.filterText).toBe('New')
        const items = document.querySelectorAll('[role="menuitem"]')
        expect(items.length).toBe(2)
      })

      it('should not update search during CJK IME composition until compositionend', async () => {
        const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
        const baseline = document.querySelectorAll('[role="menuitem"]').length

        filterInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
        filterInput.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'かんじ', bubbles: true }))
        filterInput.value = 'かんじ'
        filterInput.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()

        expect(wrapper.vm.filterText).toBe('')
        expect(document.querySelectorAll('[role="menuitem"]').length).toBe(baseline)

        filterInput.dispatchEvent(new CompositionEvent('compositionend', { data: 'かんじ', bubbles: true }))
        await nextTick()
        await nextTick()

        expect(wrapper.vm.filterText).toBe('かんじ')
        expect(document.querySelectorAll('[role="menuitem"]').length).toBe(0)
      })
    })

    it('should not navigate items during IME composition (arrow keys are IME candidate navigation)', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.focus()

      filterInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
      await nextTick()

      // Arrow keys mid-composition navigate IME candidates: the menu must not
      // highlight an item nor steal focus away from the filter input.
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      Object.defineProperty(event, 'isComposing', { value: true })
      filterInput.dispatchEvent(event)
      await nextTick()

      expect(document.querySelector('[role="menuitem"][data-highlighted]')).toBeNull()
      expect(document.activeElement).toBe(filterInput)

      // Once composition ends, navigation works again
      filterInput.dispatchEvent(new CompositionEvent('compositionend', { data: '', bubbles: true }))
      await nextTick()
      await nextTick()
      filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await nextTick()

      expect(document.querySelector('[role="menuitem"][data-highlighted]')).not.toBeNull()
    })
  })
})

describe('given a DropdownMenuFilter model', () => {
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const Fixture = defineComponent({
    props: { filterProps: { type: Object, default: () => ({}) } },
    setup: props => () => h(DropdownMenuRoot, { open: true }, () => [
      h(DropdownMenuTrigger, () => 'Open'),
      h(DropdownMenuContent, () => [
        h(DropdownMenuFilter, { 'aria-label': 'Filter', ...props.filterProps }),
        h(DropdownMenuItem, () => 'New Tab'),
      ]),
    ]),
  })

  let wrapper: VueWrapper | undefined
  afterEach(() => wrapper?.unmount())

  async function mountFilter(filterProps: Record<string, unknown> = {}) {
    document.body.innerHTML = ''
    wrapper = mount(Fixture, { props: { filterProps }, attachTo: document.body })
    await nextTick()
    await nextTick()
    const filter = wrapper.findComponent(DropdownMenuFilter)
    return { filter, input: filter.element as HTMLInputElement }
  }

  async function inputValue(input: HTMLInputElement, value: string) {
    input.value = value
    input.dispatchEvent(new Event('input'))
    await nextTick()
  }

  async function escape(input: HTMLInputElement) {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    input.dispatchEvent(event)
    await nextTick()
    return event
  }

  it('uncontrolled: keeps the typed text and emits it as the only argument', async () => {
    const { filter, input } = await mountFilter()
    expect(input.value).toBe('')
    await inputValue(input, 'ne')
    expect(input.value).toBe('ne')
    expect(filter.emitted('update:modelValue')).toEqual([['ne']])
    expect(filter.emitted('beforeUpdate:modelValue')).toBeUndefined()
  })

  it('uncontrolled: does not emit when the text is unchanged', async () => {
    const { filter, input } = await mountFilter()
    await inputValue(input, '')
    expect(filter.emitted('update:modelValue')).toBeUndefined()
  })

  it('uncontrolled: Escape clears a non-empty text and emits an empty string', async () => {
    const { filter, input } = await mountFilter()
    await inputValue(input, 'ne')
    await escape(input)
    expect(input.value).toBe('')
    expect(filter.emitted('update:modelValue')).toEqual([['ne'], ['']])
    // An empty filter leaves Escape alone.
    await escape(input)
    expect(filter.emitted('update:modelValue')).toEqual([['ne'], ['']])
  })

  it('uncontrolled: follows a `modelValue` the parent sets later', async () => {
    const { input } = await mountFilter()
    await wrapper!.setProps({ filterProps: { modelValue: 'tab' } })
    expect(input.value).toBe('tab')
  })

  it('controlled: reflects the prop and emits without applying until the parent does', async () => {
    const { filter, input } = await mountFilter({ modelValue: 'ne' })
    expect(input.value).toBe('ne')
    await inputValue(input, 'new')
    expect(filter.emitted('update:modelValue')).toEqual([['new']])
    expect(filter.emitted('beforeUpdate:modelValue')).toBeUndefined()
    await wrapper!.setProps({ filterProps: { modelValue: 'tab' } })
    expect(input.value).toBe('tab')
  })

  it('controlled: emits on input even when the text is unchanged', async () => {
    const { filter, input } = await mountFilter({ modelValue: 'ne' })
    await inputValue(input, 'ne')
    expect(filter.emitted('update:modelValue')).toEqual([['ne']])
  })

  it('controlled: Escape emits an empty string and keeps the text until the parent applies it', async () => {
    const { filter, input } = await mountFilter({ modelValue: 'ne' })
    await escape(input)
    expect(filter.emitted('update:modelValue')).toEqual([['']])
    expect(input.value).toBe('ne')
    // The prop is still `'ne'`, so a second Escape clears again.
    await escape(input)
    expect(filter.emitted('update:modelValue')).toEqual([[''], ['']])
  })

  it('controlled: reads an empty text once the binding is cleared', async () => {
    document.body.innerHTML = ''
    const text = ref<string | undefined>('ne')
    wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { open: true }, () => [
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuContent, () => [
          h(DropdownMenuFilter, { modelValue: text.value, as: 'div' }, {
            default: ({ modelValue }: { modelValue: unknown }) => h('span', { 'data-testid': 'text' }, JSON.stringify(modelValue ?? null)),
          }),
        ]),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    expect(document.querySelector('[data-testid=text]')?.textContent).toBe('"ne"')
    text.value = undefined
    await nextTick()
    expect(document.querySelector('[data-testid=text]')?.textContent).toBe('""')
  })

  it('bound after mount: reads an empty text once the binding is cleared', async () => {
    document.body.innerHTML = ''
    const text = ref<string | undefined>(undefined)
    wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { open: true }, () => [
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuContent, () => [
          h(DropdownMenuFilter, { modelValue: text.value, as: 'div' }, {
            default: ({ modelValue }: { modelValue: unknown }) => h('span', { 'data-testid': 'text' }, JSON.stringify(modelValue ?? null)),
          }),
        ]),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    text.value = 'ne'
    await nextTick()
    expect(document.querySelector('[data-testid=text]')?.textContent).toBe('"ne"')
    text.value = undefined
    await nextTick()
    expect(document.querySelector('[data-testid=text]')?.textContent).toBe('""')
  })

  it('v-model: typing and Escape update the bound value', async () => {
    document.body.innerHTML = ''
    const text = ref('ne')
    wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { open: true }, () => [
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuContent, () => [
          h(DropdownMenuFilter, { 'aria-label': 'Filter', 'modelValue': text.value, 'onUpdate:modelValue': (v: string) => { text.value = v } }),
          h(DropdownMenuItem, () => 'New Tab'),
        ]),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const input = wrapper.findComponent(DropdownMenuFilter).element as HTMLInputElement
    expect(input.value).toBe('ne')
    await inputValue(input, 'new')
    expect(text.value).toBe('new')
    await escape(input)
    expect(text.value).toBe('')
    expect(input.value).toBe('')
    text.value = 'tab'
    await nextTick()
    expect(input.value).toBe('tab')
  })
})
