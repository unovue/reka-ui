import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { CollapsibleContent, CollapsibleRoot } from '.'

// Size transitions in a real browser (#2827): the panel animates
// `height: var(--reka-collapsible-content-height)` to and from
// `data-starting-style` / `data-ending-style`.

const PANEL_CSS = `
  .panel { overflow: hidden; height: var(--reka-collapsible-content-height); transition: height 400ms linear; }
  .panel[data-starting-style], .panel[data-ending-style] { height: 0; }
  .inner { height: 100px; }
`

const styles: HTMLStyleElement[] = []
function addStyles(css: string) {
  const element = document.createElement('style')
  element.textContent = css
  document.head.appendChild(element)
  styles.push(element)
}
afterEach(() => {
  styles.splice(0).forEach(element => element.remove())
})

const nextFrame = () => new Promise<number>(resolve => requestAnimationFrame(resolve))
const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const heightOf = (id: string) => byTestId(id)!.getBoundingClientRect().height

function mountCollapsible(initialOpen: boolean) {
  const open = ref(initialOpen)
  const onOpenComplete = vi.fn()
  mount(defineComponent({
    setup: () => () => h(CollapsibleRoot, { 'open': open.value, 'onUpdate:openComplete': onOpenComplete }, () =>
      h(CollapsibleContent, { 'data-testid': 'content', 'class': 'panel' }, () => h('div', { class: 'inner' }, 'Content'))),
  }), { attachTo: document.body })
  return { open, onOpenComplete }
}

/** Waits until the panel is part-way through its transition. */
async function waitForMidway(id: string) {
  await vi.waitFor(() => {
    const height = heightOf(id)
    expect(height).toBeGreaterThan(20)
    expect(height).toBeLessThan(80)
  }, { timeout: 2000, interval: 5 })
}

describe('given a Collapsible with a height transition', () => {
  it('closing mid-open shrinks from the current height', async () => {
    addStyles(PANEL_CSS)
    const { open, onOpenComplete } = mountCollapsible(false)
    await nextFrame()
    await nextFrame()

    open.value = true
    await waitForMidway('content')
    const before = heightOf('content')

    open.value = false
    const samples: number[] = []
    for (let i = 0; i < 4; i++) {
      await nextFrame()
      samples.push(heightOf('content'))
    }
    expect(Math.max(...samples)).toBeLessThanOrEqual(before + 5)
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenLastCalledWith(false), { timeout: 2000 })
    expect(onOpenComplete).not.toHaveBeenCalledWith(true)
  })

  it('reopening mid-close grows from the current height', async () => {
    addStyles(PANEL_CSS)
    const { open, onOpenComplete } = mountCollapsible(true)
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true))
    await nextFrame()
    await nextFrame()

    open.value = false
    await waitForMidway('content')
    const before = heightOf('content')

    open.value = true
    const samples: number[] = []
    for (let i = 0; i < 4; i++) {
      await nextFrame()
      samples.push(heightOf('content'))
    }
    // Growing again from where it was, not jumping to the full 100px.
    expect(samples[0]).toBeLessThan(before + 20)
    expect(Math.max(...samples)).toBeLessThan(95)
    await vi.waitFor(() => expect(heightOf('content')).toBe(100), { timeout: 2000 })
    expect(onOpenComplete).not.toHaveBeenCalledWith(false)
  })

  it('a keyframe animation on the size variable still runs both ways', async () => {
    addStyles(`
      .kf { overflow: hidden; }
      .kf[data-state=open] { animation: collapsible-down 400ms linear; }
      .kf[data-state=closed] { animation: collapsible-up 400ms linear; }
      @keyframes collapsible-down { from { height: 0 } to { height: var(--reka-collapsible-content-height) } }
      @keyframes collapsible-up { from { height: var(--reka-collapsible-content-height) } to { height: 0 } }
      .inner { height: 100px; }
    `)
    const open = ref(false)
    const onOpenComplete = vi.fn()
    mount(defineComponent({
      setup: () => () => h(CollapsibleRoot, { 'open': open.value, 'onUpdate:openComplete': onOpenComplete }, () =>
        h(CollapsibleContent, { 'data-testid': 'content', 'class': 'kf' }, () => h('div', { class: 'inner' }, 'Content'))),
    }), { attachTo: document.body })
    await nextFrame()
    await nextFrame()

    open.value = true
    await waitForMidway('content')
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenCalledWith(true), { timeout: 2000 })
    expect(heightOf('content')).toBe(100)

    open.value = false
    await waitForMidway('content')
    expect(byTestId('content')!.hidden).toBe(false)
    await vi.waitFor(() => expect(onOpenComplete).toHaveBeenLastCalledWith(false), { timeout: 2000 })
    expect(byTestId('content')!.hidden).toBe(true)
  })
})

describe('given an Accordion with height transitions', () => {
  // Base UI #3099: switching items closes one panel and opens the other in the
  // same tick; both must animate.
  it('switching items shrinks the closing item and grows the opening one', async () => {
    addStyles(PANEL_CSS)
    const value = ref<string | undefined>('a')
    mount(defineComponent({
      setup: () => () => h(AccordionRoot, { type: 'single', collapsible: true, modelValue: value.value }, () =>
        ['a', 'b'].map(item => h(AccordionItem, { value: item }, () => [
          h(AccordionHeader, () => h(AccordionTrigger, () => item)),
          h(AccordionContent, { 'data-testid': item, 'class': 'panel' }, () => h('div', { class: 'inner' }, item)),
        ]))),
    }), { attachTo: document.body })
    await vi.waitFor(() => expect(heightOf('a')).toBe(100))
    await nextFrame()

    value.value = 'b'
    await vi.waitFor(() => {
      expect(heightOf('a')).toBeGreaterThan(5)
      expect(heightOf('a')).toBeLessThan(95)
      expect(heightOf('b')).toBeGreaterThan(5)
      expect(heightOf('b')).toBeLessThan(95)
    }, { timeout: 2000, interval: 5 })

    await vi.waitFor(() => expect(byTestId('a')!.hidden).toBe(true), { timeout: 2000 })
    await vi.waitFor(() => expect(heightOf('b')).toBe(100), { timeout: 2000 })
  })
})
