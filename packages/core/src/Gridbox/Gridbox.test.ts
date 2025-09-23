import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { useKbd } from '@/shared'
import { handleSubmit } from '@/test'
import Gridbox from './story/_Gridbox.vue'

describe('given default Gridbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Gridbox>>
  let content: DOMWrapper<Element>
  let cells: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Gridbox, { attachTo: document.body })
    content = wrapper.find('[role=grid]')
    cells = wrapper.findAll('[role=gridcell]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('when focus on content', () => {
    beforeEach(async () => {
      await content.trigger('focus')
    })

    it('should pass the focus to the first cell', () => {
      expect(document.activeElement).toBe(cells[0].element)
    })

    it('should have highlighted state on first cell', () => {
      expect(cells[0].attributes('data-highlighted')).toBe('')
    })

    it('should emit `highlight` event', () => {
      expect(wrapper.emitted('highlight')?.[0]?.[0]).toBeTruthy()
    })

    it('should highlight and select cell when clicked', async () => {
      const cell = cells[2]
      await cell.trigger('click')
      expect(cell.attributes('aria-selected')).toBe('true')
      expect(cell.attributes('data-state')).toBe('checked')
    })

    describe('after pressing `Enter`', async () => {
      beforeEach(async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
      })

      it('should select the highlighted cell', () => {
        const cell = cells[0]
        expect(cell.attributes('data-highlighted')).toBe('')
        expect(cell.attributes('aria-selected')).toBe('true')
        expect(cell.attributes('data-state')).toBe('checked')
      })

      it('should emit `update:modelValue` event', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(cells[0].text())
      })

      it('should deselect after pressing `Enter`', async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
        const cell = cells[0]
        expect(cell.attributes('data-highlighted')).toBe('')
        expect(cell.attributes('aria-selected')).toBe('false')
        expect(cell.attributes('data-state')).toBe('unchecked')
      })
    })

    describe('after pressing `Space`', async () => {
      beforeEach(async () => {
        await content.trigger('keydown', { key: kbd.SPACE })
      })

      it('should select the highlighted cell', () => {
        const cell = cells[0]
        expect(cell.attributes('data-highlighted')).toBe('')
        expect(cell.attributes('aria-selected')).toBe('true')
        expect(cell.attributes('data-state')).toBe('checked')
      })
    })

    describe('grid navigation', () => {
      it('should navigate right with ArrowRight', async () => {
        await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
        expect(document.activeElement).toBe(cells[1].element)
        expect(cells[1].attributes('data-highlighted')).toBe('')
      })

      it('should navigate down with ArrowDown', async () => {
        await content.trigger('keydown', { key: kbd.ARROW_DOWN })
        // With a 2-column grid, first cell in second row would be cells[2]
        expect(document.activeElement).toBe(cells[2].element)
        expect(cells[2].attributes('data-highlighted')).toBe('')
      })

      it('should navigate left with ArrowLeft', async () => {
        // Start from second cell
        await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
        await content.trigger('keydown', { key: kbd.ARROW_LEFT })
        expect(document.activeElement).toBe(cells[0].element)
        expect(cells[0].attributes('data-highlighted')).toBe('')
      })

      it('should navigate up with ArrowUp', async () => {
        // Navigate to second row, then back up
        await content.trigger('keydown', { key: kbd.ARROW_DOWN })
        await content.trigger('keydown', { key: kbd.ARROW_UP })
        expect(document.activeElement).toBe(cells[0].element)
        expect(cells[0].attributes('data-highlighted')).toBe('')
      })

      it('should wrap to next row when navigating right at row end', async () => {
        // Navigate to end of first row (2 columns)
        await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
        await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
        expect(document.activeElement).toBe(cells[2].element) // First cell of second row
      })

      it('should wrap to previous row when navigating left at row start', async () => {
        // Navigate to second row first cell, then left
        await content.trigger('keydown', { key: kbd.ARROW_DOWN })
        await content.trigger('keydown', { key: kbd.ARROW_LEFT })
        expect(document.activeElement).toBe(cells[1].element) // Last cell of first row
      })

      it('should navigate to first cell in row with Home', async () => {
        // Navigate to middle of first row
        await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
        await content.trigger('keydown', { key: kbd.HOME })
        expect(document.activeElement).toBe(cells[0].element)
      })

      it('should navigate to last cell in row with End', async () => {
        await content.trigger('keydown', { key: kbd.END })
        expect(document.activeElement).toBe(cells[1].element) // Last cell of first row (2-column grid)
      })

      it('should not move beyond grid boundaries', async () => {
        // Try to move up from first row
        await content.trigger('keydown', { key: kbd.ARROW_UP })
        expect(document.activeElement).toBe(cells[0].element)

        // Try to move left from first cell
        await content.trigger('keydown', { key: kbd.ARROW_LEFT })
        expect(document.activeElement).toBe(cells[0].element)
      })
    })
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(() => {
      wrapper.setProps({ selectionBehavior: 'replace' })
    })

    it('should not toggle off the selected value', async () => {
      const cell = cells[0]
      await cell.trigger('click')
      await cell.trigger('click')
      expect(document.activeElement).toBe(cell.element)
    })

    it('should select and replace another cell', async () => {
      const cell = cells[0]
      const newCell = cells[1]
      await cell.trigger('click')
      expect(document.activeElement).toBe(cell.element)
      await newCell.trigger('click')
      expect(document.activeElement).toBe(newCell.element)
    })
  })
})

describe('given multiple `true` Gridbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Gridbox>>
  let content: DOMWrapper<Element>
  let cells: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Gridbox, { props: { multiple: true, selectionBehavior: 'toggle' }, attachTo: document.body })
    await nextTick()
    content = wrapper.find('[role=grid]')
    cells = wrapper.findAll('[role=gridcell]')
    await content.trigger('focus')
  })

  it('should select multiple cells', async () => {
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })

    expect(cells[0].attributes('aria-selected')).toBe('true')
    expect(cells[1].attributes('aria-selected')).toBe('true')
    expect(cells[2].attributes('aria-selected')).toBe('false')
    expect(cells[3].attributes('aria-selected')).toBe('true') // 2-column grid: row 1, col 1
  })

  it('should emit `update:modelValue` event', async () => {
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_LEFT })
    await content.trigger('keydown', { key: kbd.ENTER })
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [[cells[0].text()]],
      [[cells[0].text(), cells[1].text()]],
      [[cells[1].text()]],
    ])
  })

  it('should select all cells with Ctrl+A', async () => {
    await content.trigger('keydown', { key: 'a', ctrlKey: true })

    // Check that all cells are selected
    cells.forEach((cell) => {
      expect(cell.attributes('aria-selected')).toBe('true')
    })
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(async () => {
      wrapper.setProps({ selectionBehavior: 'replace' })
      await nextTick()
      await cells[0].trigger('click')
    })

    it('should not toggle off the selected value', async () => {
      const cell = cells[0]
      await cell.trigger('click')
      expect(document.activeElement).toBe(cell.element)
    })

    it('should select and replace another cell', async () => {
      const cell = cells[0]
      const newCell = cells[1]
      expect(document.activeElement).toBe(cell.element)
      await newCell.trigger('click')
      expect(document.activeElement).toBe(newCell.element)
    })

    it('should emit `update:modelValue` event', async () => {
      await content.trigger('keydown', { key: kbd.ENTER })
      await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
      await content.trigger('keydown', { key: kbd.ENTER })
      expect(wrapper.emitted('update:modelValue')).toEqual([
        [[cells[0].text()]],
        [[cells[0].text()]], // there's a bug here, it shouldn't emit the same value twice
        [[cells[1].text()]],
      ])
    })
  })
})

describe('given Gridbox with highlightOnHover', () => {
  let wrapper: VueWrapper<InstanceType<typeof Gridbox>>
  let content: DOMWrapper<Element>
  let cells: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Gridbox, { props: { highlightOnHover: true }, attachTo: document.body })
    content = wrapper.find('[role=grid]')
    cells = wrapper.findAll('[role=gridcell]')
  })

  it('should highlight cell on mouse enter', async () => {
    await cells[2].trigger('mouseenter')
    expect(cells[2].attributes('data-highlighted')).toBe('')
    expect(document.activeElement).toBe(cells[2].element)
  })
})

describe('given Gridbox in a form', async () => {
  let cells: DOMWrapper<Element>[]

  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Gridbox },
    template: '<form @submit="handleSubmit"><Gridbox name="test" default-value="red" /></form>',
  }, {
    props: { handleSubmit },
  })

  beforeEach(() => {
    cells = wrapper.findAll('[role=gridcell]')
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('input[data-hidden]').exists()).toBe(true)
  })

  describe('after selecting option and clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: 'red' })
    })
  })

  describe('after selecting other option and click submit button again', () => {
    beforeEach(async () => {
      await cells[4].trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(2)
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ test: cells[4].text() })
    })
  })
})
