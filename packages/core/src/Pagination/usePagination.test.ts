import type { PaginationChangeReason } from './usePagination'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import { PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from '.'
import { usePagination } from './usePagination'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('usePagination — model', () => {
  it('starts at defaultPage (1 by default) and derives pageCount', () => {
    const p = usePagination({ itemsPerPage: 10, total: 95 })
    expect(p.page.value).toBe(1)
    expect(p.pageCount.value).toBe(10)
    expect(p.isControlled.value).toBe(false)
    expect(p.lastChangeDetails.value.reason).toBe('none')
    expect(usePagination({ itemsPerPage: 10, total: 0 }).pageCount.value).toBe(1)
    expect(usePagination({ itemsPerPage: 10, total: 50, defaultPage: 3 }).page.value).toBe(3)
  })

  it('uncontrolled: setPage writes and fires onUpdate once per real change', () => {
    const onUpdate = vi.fn()
    const p = usePagination({ itemsPerPage: 10, total: 100, onUpdate })
    expect(p.setPage(4)).toBe(true)
    expect(p.page.value).toBe(4)
    expect(p.setPage(4)).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith(4, expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('controlled getter + emit: emits beforeUpdate:page then update:page, writes nothing', () => {
    const emit = vi.fn()
    const p = usePagination({ itemsPerPage: 10, total: 100, page: () => 2, emit })
    expect(p.isControlled.value).toBe(true)
    p.next.props.value.onClick(new MouseEvent('click'))
    expect(p.page.value).toBe(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:page', 3, expect.objectContaining({ reason: 'next-press' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:page', 3, expect.objectContaining({ reason: 'next-press' }))
  })

  it('ref-owned: writes back to the passed ref', () => {
    const page = ref(1)
    const p = usePagination({ itemsPerPage: 10, total: 100, page })
    p.last.props.value.onClick(new MouseEvent('click'))
    expect(page.value).toBe(10)
  })

  it('cancel in onBeforeUpdate keeps the page', () => {
    const onUpdate = vi.fn()
    const p = usePagination({
      itemsPerPage: 10,
      total: 100,
      onBeforeUpdate: (_v, details) => details.cancel(),
      onUpdate,
    })
    expect(p.setPage(3)).toBe(false)
    expect(p.page.value).toBe(1)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(p.lastChangeDetails.value.isCanceled).toBe(true)
  })
})

describe('usePagination — reasons', () => {
  it.each([
    ['first', 1, 'first-press'],
    ['prev', 4, 'prev-press'],
    ['next', 6, 'next-press'],
    ['last', 10, 'last-press'],
  ] as const)('%s reports %s with %s and the click event', (part, target, reason) => {
    const onUpdate = vi.fn()
    const p = usePagination({ itemsPerPage: 10, total: 100, defaultPage: 5, onUpdate })
    const event = new MouseEvent('click')
    p[part].props.value.onClick(event)
    expect(onUpdate).toHaveBeenCalledWith(target, expect.objectContaining({ reason, event }))
  })

  it('a list item reports item-press', () => {
    const onUpdate = vi.fn()
    const p = usePagination({ itemsPerPage: 10, total: 100, onUpdate })
    p.getListItemSurface(7).props.value.onClick(new MouseEvent('click'))
    expect(onUpdate).toHaveBeenCalledWith(7, expect.objectContaining({ reason: 'item-press' satisfies PaginationChangeReason }))
  })

  it('disabled buttons and items do nothing', () => {
    const onUpdate = vi.fn()
    const p = usePagination({ itemsPerPage: 10, total: 100, onUpdate })
    p.prev.props.value.onClick(new MouseEvent('click'))
    p.first.props.value.onClick(new MouseEvent('click'))
    expect(onUpdate).not.toHaveBeenCalled()

    const disabled = usePagination({ itemsPerPage: 10, total: 100, disabled: true, onUpdate })
    disabled.next.props.value.onClick(new MouseEvent('click'))
    disabled.getListItemSurface(3).props.value.onClick(new MouseEvent('click'))
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('usePagination — surfaces', () => {
  it('navigation buttons carry aria-label/disabled and no data-*', () => {
    const p = usePagination({ itemsPerPage: 10, total: 100 })
    expect(p.prev.props.value).toMatchObject({ 'aria-label': 'Previous Page', 'disabled': true })
    expect(p.next.props.value).toMatchObject({ 'aria-label': 'Next Page', 'disabled': false })
    expect(p.prev.state.value).toEqual({ disabled: true })
    expect(noDataAttrs(p.prev.attrs.value)).toBe(true)
  })

  it('list items carry aria-current, data-type and the v2 data-selected="true"', () => {
    const p = usePagination({ itemsPerPage: 10, total: 100, defaultPage: 2 })
    const selected = p.getListItemSurface(2)
    expect(noDataAttrs(selected.props.value)).toBe(true)
    expect(selected.attrs.value).toMatchObject({ 'aria-label': 'Page 2', 'aria-current': 'page', 'data-type': 'page', 'data-selected': 'true' })
    expect(p.getListItemSurface(3).attrs.value['data-selected']).toBeUndefined()
    expect(p.ellipsis.attrs.value).toEqual({ 'data-type': 'ellipsis' })
  })

  it('items follow the page', () => {
    const p = usePagination({ itemsPerPage: 10, total: 100, showEdges: true })
    expect(p.items.value.at(-2)).toEqual({ type: 'ellipsis' })
    p.setPage(10)
    expect(p.items.value[0]).toEqual({ type: 'page', value: 1 })
    expect(p.items.value[1]).toEqual({ type: 'ellipsis' })
  })
})

describe('usePagination — standalone render', () => {
  const Standalone = defineComponent({
    setup() {
      const p = usePagination({ itemsPerPage: 10, total: 50 })
      return () => h('nav', { 'aria-label': 'Pages' }, [
        h('button', { type: 'button', ...p.prev.attrs.value }, 'Prev'),
        ...p.items.value.map(item => item.type === 'page'
          ? h('button', { type: 'button', key: item.value, ...p.getListItemSurface(item.value).attrs.value }, String(item.value))
          : h('span', p.ellipsis.attrs.value, '…')),
        h('button', { type: 'button', ...p.next.attrs.value }, 'Next'),
      ])
    },
  })

  it('renders, navigates and passes axe', async () => {
    const { container, getByLabelText } = render(Standalone)
    expect(getByLabelText('Page 1')).toHaveAttribute('aria-current', 'page')
    await fireEvent.click(getByLabelText('Next Page'))
    expect(getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('paginationRoot — details contract', () => {
  function mountRoot(props: Record<string, any>) {
    return render(defineComponent({
      setup: () => () => h(PaginationRoot, { itemsPerPage: 10, total: 100, ...props }, () =>
        h(PaginationList, null, {
          default: ({ items }: any) => [
            h(PaginationFirst),
            h(PaginationPrev),
            ...items.filter((i: any) => i.type === 'page').map((i: any) => h(PaginationListItem, { key: i.value, value: i.value })),
            h(PaginationNext),
            h(PaginationLast),
          ],
        })),
    }))
  }

  it('emits update:page with details, and nothing for the current page', async () => {
    const onUpdate = vi.fn()
    const { getByLabelText } = mountRoot({ 'onUpdate:page': onUpdate })
    await fireEvent.click(getByLabelText('Page 1'))
    expect(onUpdate).not.toHaveBeenCalled()
    await fireEvent.click(getByLabelText('Page 3'))
    expect(onUpdate).toHaveBeenCalledWith(3, expect.objectContaining({ reason: 'item-press' }))
  })

  it('beforeUpdate:page can cancel', async () => {
    const onUpdate = vi.fn()
    const { getByLabelText } = mountRoot({
      'onBeforeUpdate:page': (_v: number, details: any) => details.cancel(),
      'onUpdate:page': onUpdate,
    })
    await fireEvent.click(getByLabelText('Next Page'))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(getByLabelText('Page 1')).toHaveAttribute('aria-current', 'page')
  })

  it('controlled: stays on the bound page until the parent updates it', async () => {
    const onUpdate = vi.fn()
    const { getByLabelText } = mountRoot({ 'page': 2, 'onUpdate:page': onUpdate })
    await fireEvent.click(getByLabelText('Last Page'))
    expect(onUpdate).toHaveBeenCalledWith(10, expect.objectContaining({ reason: 'last-press' }))
    expect(getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page')
  })
})
