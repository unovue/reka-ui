import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { sleep } from '@/test'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '.'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

async function settle() {
  await nextTick()
  await sleep(20)
  await nextTick()
}

function pressEscape(target: Element | null = document.activeElement) {
  (target ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
}

const Popovers = defineComponent({
  components: { PopoverContent, PopoverRoot, PopoverTrigger },
  props: { modal: Boolean, unmountOnHide: Boolean, showFirst: { type: Boolean, default: true }, onInteractOutside: Function, onOpenAutoFocus: Function, onCloseAutoFocus: Function },
  template: `<div>
  <button data-testid="outside">outside</button>
  <PopoverRoot v-if="showFirst" :modal="modal" :unmount-on-hide="unmountOnHide">
    <PopoverTrigger data-testid="trigger-1">One</PopoverTrigger>
    <PopoverContent data-testid="content-1" @interact-outside="onInteractOutside" @open-auto-focus="onOpenAutoFocus" @close-auto-focus="onCloseAutoFocus">
      <button>Inside one</button>
    </PopoverContent>
  </PopoverRoot>
  <PopoverRoot :modal="modal" :unmount-on-hide="unmountOnHide">
    <PopoverTrigger data-testid="trigger-2">Two</PopoverTrigger>
    <PopoverContent data-testid="content-2">
      <button>Inside two</button>
    </PopoverContent>
  </PopoverRoot>
</div>`,
})

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!

function isHidden(id: string) {
  let el: HTMLElement | null = document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  while (el) {
    if (el.style.display === 'none')
      return true
    el = el.parentElement
  }
  return !document.querySelector(`[data-testid="${id}"]`)
}

// Every case runs with `unmountOnHide` both on and off: kept-mounted content
// must behave exactly like unmounted content while it is hidden.
describe.each([
  [true, false],
  [false, false],
  [true, true],
  [false, true],
])('given Popovers with modal=%s and unmountOnHide=%s', (modal, unmountOnHide) => {
  let wrapper: VueWrapper
  const onInteractOutside = vi.fn()
  const onOpenAutoFocus = vi.fn()
  const onCloseAutoFocus = vi.fn()

  beforeEach(async () => {
    document.body.innerHTML = ''
    document.body.style.cssText = ''
    onInteractOutside.mockClear()
    onOpenAutoFocus.mockClear()
    onCloseAutoFocus.mockClear()
    wrapper = mount(Popovers, {
      attachTo: document.body,
      props: { modal, unmountOnHide, onInteractOutside, onOpenAutoFocus, onCloseAutoFocus },
    })
    await settle()
  })

  afterEach(() => wrapper.unmount())

  it('should keep the content mounted only when unmountOnHide is false', () => {
    expect(!!document.querySelector('[data-testid="content-1"]')).toBe(!unmountOnHide)
    expect(isHidden('content-1')).toBe(true)
  })

  it('should have no side effects before the first open', () => {
    expect(document.body.style.pointerEvents).not.toBe('none')
    expect(document.body.style.overflow).not.toBe('hidden')
    expect(onOpenAutoFocus).not.toHaveBeenCalled()
  })

  it('should ignore outside pointerdown while hidden', async () => {
    get('outside').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(onInteractOutside).not.toHaveBeenCalled()
  })

  it('should move focus in on open and back to the trigger on close', async () => {
    get('trigger-1').focus()
    get('trigger-1').click()
    await settle()
    expect(isHidden('content-1')).toBe(false)
    expect(get('content-1').contains(document.activeElement)).toBe(true)

    pressEscape()
    await settle()
    expect(isHidden('content-1')).toBe(true)
    expect(document.activeElement).toBe(get('trigger-1'))
    expect(document.body.style.pointerEvents).not.toBe('none')
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('should move focus in again on reopen', async () => {
    get('trigger-1').focus()
    get('trigger-1').click()
    await settle()
    pressEscape()
    await settle()

    get('trigger-1').click()
    await settle()
    expect(isHidden('content-1')).toBe(false)
    expect(get('content-1').contains(document.activeElement)).toBe(true)
  })

  it('should close the open popover on Escape even when a hidden one is mounted after it', async () => {
    get('trigger-1').focus()
    get('trigger-1').click()
    await settle()
    pressEscape()
    await settle()
    expect(isHidden('content-1')).toBe(true)
  })

  it('should not move focus when closed content is later removed', async () => {
    get('trigger-1').focus()
    get('trigger-1').click()
    await settle()
    pressEscape()
    await settle()
    const closeAutoFocusCalls = onCloseAutoFocus.mock.calls.length

    get('outside').focus()
    await wrapper.setProps({ showFirst: false })
    await settle()
    expect(document.activeElement).toBe(get('outside'))
    expect(onCloseAutoFocus).toHaveBeenCalledTimes(closeAutoFocusCalls)
  })

  it('should close the open popover on outside click', async () => {
    get('trigger-1').click()
    await settle()
    // The outside listener attaches on a timer, so retry until it is live.
    await vi.waitFor(() => {
      get('outside').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      get('outside').click()
      expect(isHidden('content-1')).toBe(true)
    })
  })
})

describe.each([false, true])('given never-opened Popovers with unmountOnHide=%s', (unmountOnHide) => {
  it('should not track the position of hidden content', async () => {
    document.body.innerHTML = ''
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const wrapper = mount(Popovers, { attachTo: document.body, props: { unmountOnHide } })
    await settle()
    const positionListeners = addEventListener.mock.calls.filter(([type]) => type === 'scroll' || type === 'resize')
    addEventListener.mockRestore()
    wrapper.unmount()
    expect(positionListeners).toHaveLength(0)
  })
})

describe.each([false, true])('given a modal Popover with unmountOnHide=%s', (unmountOnHide) => {
  beforeEach(() => {
    // `useHideOthers` is disabled in test mode.
    vi.stubEnv('MODE', 'production')
    document.body.innerHTML = ''
  })

  afterEach(() => vi.unstubAllEnvs())

  it('should only hide outside content from assistive tech while open', async () => {
    const wrapper = mount(Popovers, { attachTo: document.body, props: { modal: true, unmountOnHide } })
    await settle()
    expect(get('outside').closest('[aria-hidden="true"]')).toBeNull()

    get('trigger-1').click()
    await settle()
    expect(get('outside').closest('[aria-hidden="true"]')).not.toBeNull()

    get('trigger-1').click()
    await settle()
    expect(get('outside').closest('[aria-hidden="true"]')).toBeNull()
    wrapper.unmount()
  })
})
