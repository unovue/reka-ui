import { fireEvent, render } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DrawerClose, DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

function drawer(rootProps: Record<string, unknown> = {}, contentProps: Record<string, unknown> = {}) {
  return defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(DrawerRoot, rootProps, () => [
          h(DrawerTrigger, null, () => 'Open'),
          h(DrawerPortal, null, () => h(DrawerContent, { 'aria-describedby': undefined, ...contentProps }, () => [
            h(DrawerTitle, null, () => 'Title'),
            h(DrawerClose, null, () => 'Close'),
          ])),
        ]),
      ])
    },
  })
}

describe('drawerRoot update:openComplete (#2789)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations
  })

  it('reports true once open and false once closed when the popup has no animation', async () => {
    const onOpenComplete = vi.fn()
    const { getByText } = render(drawer({ 'onUpdate:openComplete': onOpenComplete }))

    await fireEvent.click(getByText('Open'))
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))

    await fireEvent.click(getByText('Close'))
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenLastCalledWith(false))
    expect(onOpenComplete.mock.calls).toEqual([[true], [false]])
  })

  it('reports true for a drawer mounted open', async () => {
    const onOpenComplete = vi.fn()
    render(drawer({ 'defaultOpen': true, 'onUpdate:openComplete': onOpenComplete }))
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
  })

  it('waits for the popup animations before reporting', async () => {
    let finish!: () => void
    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })
    const anim = { finished, playState: 'running' }
    finished.then(() => { anim.playState = 'finished' })
    const getAnimations = vi.fn(() => [anim] as unknown as Animation[])
    HTMLElement.prototype.getAnimations = getAnimations
    const onOpenComplete = vi.fn()
    const { getByText } = render(drawer({ 'onUpdate:openComplete': onOpenComplete }))

    await fireEvent.click(getByText('Open'))
    // Read one frame after the change, as Base UI does.
    await vi.waitFor(() => expect(getAnimations).toHaveBeenCalled())
    await nextTick()
    expect(onOpenComplete).not.toHaveBeenCalled()

    finish()
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
  })

  it('a newer change supersedes a pending one', async () => {
    const pending = new Promise<void>(() => {})
    HTMLElement.prototype.getAnimations = vi.fn(() => [{ finished: pending }] as unknown as Animation[])
    const onOpenComplete = vi.fn()
    const { getByText } = render(drawer({ 'forceMount': true, 'onUpdate:openComplete': onOpenComplete }, { forceMount: true }))

    await fireEvent.click(getByText('Open'))
    // The open's animations never settle; the close is now the pending change.
    HTMLElement.prototype.getAnimations = vi.fn(() => [])
    await fireEvent.click(getByText('Close'))
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(false))
    expect(onOpenComplete).not.toHaveBeenCalledWith(true)
  })
})

describe('drawerContent forceMount focus return (#2789)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns focus to the trigger when a modal drawer closes', async () => {
    const { getByText } = render(drawer({}, { forceMount: true }))
    const trigger = getByText('Open')

    await fireEvent.click(trigger)
    getByText('Close').focus()
    await fireEvent.click(getByText('Close'))
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('honours finalFocus: false', async () => {
    const { getByText } = render(drawer({}, { forceMount: true, finalFocus: false }))
    const trigger = getByText('Open')

    await fireEvent.click(trigger)
    getByText('Close').focus()
    await fireEvent.click(getByText('Close'))
    await nextTick()
    await nextTick()
    expect(document.activeElement).not.toBe(trigger)
  })

  // Base UI returns focus only while it is inside the popup or on <body>.
  it('keeps focus the app moved outside before the drawer closes', async () => {
    const Host = defineComponent({
      setup() {
        const open = ref(false)
        return { open }
      },
      render() {
        return h('div', [
          h('input', { 'data-testid': 'search', 'aria-label': 'search' }),
          h(DrawerRoot, { 'open': this.open, 'modal': false, 'onUpdate:open': (v: boolean) => { this.open = v } }, () => [
            h(DrawerTrigger, null, () => 'Open'),
            h(DrawerPortal, null, () => h(DrawerContent, { 'forceMount': true, 'aria-describedby': undefined }, () => h(DrawerTitle, null, () => 'Title'))),
          ]),
        ])
      },
    })
    const { getByTestId, getByText } = render(Host)
    await fireEvent.click(getByText('Open'))
    await nextTick()
    const search = getByTestId('search') as HTMLInputElement
    search.focus()
    await fireEvent.click(getByText('Open'))
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(search)
  })
})
