import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { h } from 'vue'
import { PaginationNext, PaginationPrev, PaginationRoot } from '.'
import Pagination from './story/_Pagination.vue'

describe('given default Pagination', () => {
  let wrapper: VueWrapper<InstanceType<typeof Pagination>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Pagination, { attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have first page selected by default', () => {
    expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe('true')
    expect(wrapper.find('[aria-label="Page 2"]').attributes('data-selected')).toBe(undefined)
  })

  describe('after clicking on Next Page trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Next Page"]').trigger('click')
    })

    it('should have set to page 2', () => {
      expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe(undefined)
      expect(wrapper.find('[aria-label="Page 2"]').attributes('data-selected')).toBe('true')
    })
  })

  describe('after clicking on Page 3 trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Page 3"]').trigger('click')
    })

    it('should have set to page 2', () => {
      expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe(undefined)
      expect(wrapper.find('[aria-label="Page 3"]').attributes('data-selected')).toBe('true')
    })
  })

  describe('after clicking on Last Page trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Last Page"]').trigger('click')
    })

    it('should have set to page 10', () => {
      // first page will be hidden
      expect(wrapper.find('[aria-label="Page 1"]').exists()).toBeFalsy()
      expect(wrapper.find('[aria-label="Page 10"]').attributes('data-selected')).toBe('true')
    })
  })
})

const ALL_PAGINATION_BUTTONS_AS_A_PROPS = {
  first: { as: 'a' },
  prev: { as: 'a' },
  listItem: { as: 'a' },
  next: { as: 'a' },
  last: { as: 'a' },
}

describe('given Pagination with <a> as buttons', () => {
  let wrapper: VueWrapper<InstanceType<typeof Pagination>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Pagination, { attachTo: document.body, props: { ...ALL_PAGINATION_BUTTONS_AS_A_PROPS } })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not unselect page 1 after clicking on Prev Page trigger', async () => {
    await wrapper.find('[aria-label="Previous Page"]').trigger('click')
    expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe('true')
  })

  it('should not unselect last page after clicking on Next Page trigger', async () => {
    await wrapper.find('[aria-label="Last Page"]').trigger('click')
    const lastPageLabel = wrapper.find('[data-selected="true"]').attributes('aria-label')
    await wrapper.find('[aria-label="Next Page"]').trigger('click')
    expect(wrapper.find('[data-selected="true"]').attributes('aria-label')).toBe(lastPageLabel)
  })
})

describe('given Pagination with <a> as buttons and disabled', () => {
  let wrapper: VueWrapper<InstanceType<typeof Pagination>>

  const INITIAL_PAGE = 2 // Do not set to first or last page

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Pagination, { attachTo: document.body, props: { ...ALL_PAGINATION_BUTTONS_AS_A_PROPS } })
    await wrapper.find(`[aria-label="Page ${INITIAL_PAGE}"]`).trigger('click')
    wrapper.setProps({ root: { disabled: true } })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should ignore clicking on First Page trigger', async () => {
    await wrapper.find('[aria-label="First Page"]').trigger('click')

    expect(wrapper.find('[data-selected="true"]').attributes('aria-label')).toBe(`Page ${INITIAL_PAGE}`)
  })

  it('should ignore clicking on Last Page trigger', async () => {
    await wrapper.find('[aria-label="Last Page"]').trigger('click')

    expect(wrapper.find('[data-selected="true"]').attributes('aria-label')).toBe(`Page ${INITIAL_PAGE}`)
  })

  it('should ignore clicking on any non-selected page', async () => {
    await wrapper.find('[aria-label="Page 1"]').trigger('click')

    expect(wrapper.find('[data-selected="true"]').attributes('aria-label')).toBe(`Page ${INITIAL_PAGE}`)
  })
})

describe('given show-edges Pagination', () => {
  let wrapper: VueWrapper<InstanceType<typeof Pagination>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Pagination, { props: { showEdges: true }, attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have first page selected by default', () => {
    expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe('true')
    expect(wrapper.find('[aria-label="Page 2"]').attributes('data-selected')).toBe(undefined)
  })

  it('should always show Page 1 & Page 10', () => {
    expect(wrapper.find('[aria-label="Page 1"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Page 2"]').exists()).toBe(true)
  })

  describe('after clicking on Next Page trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Next Page"]').trigger('click')
    })

    it('should have set to page 2', () => {
      expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe(undefined)
      expect(wrapper.find('[aria-label="Page 2"]').attributes('data-selected')).toBe('true')
    })
  })

  describe('after clicking on Last Page trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Last Page"]').trigger('click')
    })

    it('should have set to page 10', () => {
      expect(wrapper.find('[aria-label="Page 1"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Page 10"]').attributes('data-selected')).toBe('true')
    })
  })

  describe('after clicking on Page 5 trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Page 5"]').trigger('click')
    })

    it('should have page 2', () => {
      expect(wrapper.find('[aria-label="Page 2"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Page 3"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Page 4"]').exists()).toBe(true)
    })

    it('should not have page 8', () => {
      expect(wrapper.find('[aria-label="Page 6"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Page 7"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Page 8"]').exists()).toBe(false)
    })

    it('should have right ellipsis', () => {
      expect(wrapper.findAll('[data-type="ellipsis"]').length).toBe(1)
    })
  })
})

describe('given small total value', () => {
  let wrapper: VueWrapper<InstanceType<typeof Pagination>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Pagination, { attachTo: document.body, props: { total: 13 } })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have first page selected by default', () => {
    expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe('true')
    expect(wrapper.find('[aria-label="Page 2"]').attributes('data-selected')).toBe(undefined)
  })

  it('should have only 2 page button', () => {
    expect(wrapper.findAll('[data-type="page"').length).toBe(2)
  })

  describe('after clicking on Next Page trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Next Page"]').trigger('click')
    })

    it('should have set to page 2', () => {
      expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe(undefined)
      expect(wrapper.find('[aria-label="Page 2"]').attributes('data-selected')).toBe('true')
    })
  })

  describe('after clicking on Last Page trigger', () => {
    beforeEach(async () => {
      await wrapper.find('[aria-label="Last Page"]').trigger('click')
    })

    it('should have set to page 2', () => {
      // first page will be hidden
      expect(wrapper.find('[aria-label="Page 1"]').exists()).toBeTruthy()
      expect(wrapper.find('[aria-label="Page 2"]').attributes('data-selected')).toBe('true')
    })
  })
})

describe('given 0 total value', () => {
  let wrapper: VueWrapper<InstanceType<typeof Pagination>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Pagination, { attachTo: document.body, props: { total: 0 } })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have first page selected by default', () => {
    expect(wrapper.find('[aria-label="Page 1"]').attributes('data-selected')).toBe('true')
  })

  it('all button should disabled', () => {
    expect(wrapper.find('[aria-label="First Page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Previous Page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Next Page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Last Page"]').attributes('disabled')).toBeDefined()
  })
})

describe('when the page count shrinks', () => {
  function mountPagination(props: Record<string, unknown>) {
    return mount(PaginationRoot, {
      props: { total: 100, itemsPerPage: 10, ...props },
      slots: {
        default: ({ page }: { page: number }) => [h('output', String(page)), h(PaginationPrev), h(PaginationNext)],
      },
    })
  }

  it.each([
    { model: { defaultPage: 10 }, change: { total: 20 } },
    { model: { page: 10 }, change: { itemsPerPage: 50 } },
  ])('keeps the page but navigates within the new page count with $model', async ({ model, change }) => {
    const wrapper = mountPagination(model)

    await wrapper.setProps(change)
    expect(wrapper.get('output').text()).toBe('10')
    expect(wrapper.emitted('update:page')).toBeUndefined()

    const next = wrapper.get('[aria-label="Next Page"]')
    expect(next.attributes('disabled')).toBeDefined()
    await next.trigger('click')
    await wrapper.get('[aria-label="Previous Page"]').trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[2]])
  })

  it.each([
    { model: { defaultPage: 10 }, change: { total: 20 } },
    { model: { page: 10 }, change: { itemsPerPage: 50 } },
  ])('moves to the new last page with `clampPage` and $model', async ({ model, change }) => {
    const wrapper = mountPagination({ clampPage: true, ...model })
    expect(wrapper.get('output').text()).toBe('10')

    await wrapper.setProps(change)
    expect(wrapper.get('output').text()).toBe('2')
    expect(wrapper.emitted('update:page')).toEqual([[2]])

    const next = wrapper.get('[aria-label="Next Page"]')
    expect(next.attributes('disabled')).toBeDefined()
    await next.trigger('click')
    await wrapper.get('[aria-label="Previous Page"]').trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[2], [1]])
  })

  it('brings an out-of-range page into range on mount and when `clampPage` turns on', async () => {
    const wrapper = mountPagination({ page: 20, total: 50 })
    expect(wrapper.get('output').text()).toBe('20')
    expect(wrapper.emitted('update:page')).toBeUndefined()

    await wrapper.setProps({ clampPage: true })
    expect(wrapper.get('output').text()).toBe('5')
    expect(wrapper.emitted('update:page')).toEqual([[5]])

    const mounted = mountPagination({ clampPage: true, defaultPage: 20, total: 50 })
    expect(mounted.get('output').text()).toBe('5')
    expect(mounted.emitted('update:page')).toEqual([[5]])
  })
})
