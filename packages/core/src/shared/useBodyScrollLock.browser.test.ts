import type { ScrollBodyOption } from './types'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
import { useBodyScrollLock } from './useBodyScrollLock'

// Headless Chromium draws no scrollbar, so the lock sees no gap to make up for. Reporting a
// window wider than the document gives it one. No scrollbar really goes away on lock, so
// instead of standing still the content moves left by exactly the gap that was added.
const GAP = 15
let gap = GAP

const Locker = defineComponent({
  setup(_, { expose }) {
    expose({ locked: useBodyScrollLock(false) })
    return () => null
  },
})

function mountLockers(scrollBody?: boolean | ScrollBodyOption) {
  const lockers: { locked: boolean }[] = []
  const setLocker = (index: number) => (instance: unknown) => {
    lockers[index] = instance as { locked: boolean }
  }
  mount(defineComponent({
    setup: () => () => h(ConfigProvider, { scrollBody }, () => [
      h(Locker, { ref: setLocker(0) }),
      h(Locker, { ref: setLocker(1) }),
    ]),
  }), { attachTo: document.body })

  return async (index: number, locked: boolean) => {
    lockers[index].locked = locked
    await nextTick()
    await nextTick()
  }
}

let sheet: HTMLStyleElement
let reference: HTMLElement

function styleBody({ css = '', inline }: { css?: string, inline?: string }) {
  sheet.textContent = `body { margin: 0 } ${css}`
  if (inline)
    document.body.setAttribute('style', inline)
}

function measure() {
  const { paddingRight, marginRight } = getComputedStyle(document.body)
  const { left, right } = reference.getBoundingClientRect()
  return { paddingRight, marginRight, left, right, inline: document.body.getAttribute('style') ?? '' }
}

beforeEach(() => {
  gap = GAP
  vi.spyOn(window, 'innerWidth', 'get').mockImplementation(() => document.documentElement.clientWidth + gap)
  sheet = document.createElement('style')
  document.head.append(sheet)
  reference = document.createElement('div')
  reference.style.height = '3000px'
  document.body.append(reference)
})

afterEach(() => {
  vi.restoreAllMocks()
  sheet.remove()
  reference.remove()
  document.body.removeAttribute('style')
})

describe('useBodyScrollLock, in a real browser', () => {
  it.each<{ name: string, css?: string, inline?: string, scrollBody?: boolean | ScrollBodyOption, padding: number, margin: number }>([
    { name: 'no padding or margin of its own', padding: 0, margin: 0 },
    { name: 'padding from a stylesheet', css: 'body { padding-right: 40px }', padding: 40, margin: 0 },
    { name: 'margin from a stylesheet', css: 'body { margin: 0 24px }', padding: 0, margin: 24 },
    { name: 'inline padding in rem', inline: 'padding-right: 2rem;', padding: 32, margin: 0 },
    { name: 'inline shorthands', inline: 'padding: 10px 20px; margin: 0px 24px;', padding: 20, margin: 24 },
    { name: 'scrollBody { padding: true }', css: 'body { padding-right: 40px }', scrollBody: { padding: true }, padding: 40, margin: 0 },
  ])('adds the scrollbar gap to the padding of a body with $name, and puts it back', async ({ css, inline, scrollBody, padding, margin }) => {
    styleBody({ css, inline })
    const setLocked = mountLockers(scrollBody)
    const before = measure()
    expect(before).toMatchObject({ paddingRight: `${padding}px`, marginRight: `${margin}px` })

    await setLocked(0, true)
    const locked = measure()
    expect(locked).toMatchObject({ paddingRight: `${padding + GAP}px`, marginRight: `${margin}px` })
    expect(locked.left).toBe(before.left)
    expect(locked.right).toBe(before.right - GAP)

    await setLocked(0, false)
    expect(measure()).toEqual(before)
  })

  it('keeps a body centred with auto margins in place', async () => {
    styleBody({ css: 'body { margin: 0 auto; max-width: 300px }' })
    const setLocked = mountLockers()
    const before = measure()
    const margin = Number.parseFloat(before.marginRight)
    expect(margin).toBeGreaterThan(GAP)

    // The auto margins are left to the browser. The body grows by the gap, which the
    // returning scrollbar width would absorb; here it comes out of both margins instead.
    await setLocked(0, true)
    const locked = measure()
    expect(locked).toMatchObject({ paddingRight: `${GAP}px`, marginRight: `${margin - GAP / 2}px` })
    expect(locked.inline).not.toContain('margin')
    expect(locked.left).toBe(before.left - GAP / 2)
    expect(locked.right).toBe(before.right - GAP / 2)

    await setLocked(0, false)
    expect(measure()).toEqual(before)
  })

  it('holds the padding until the last of two locks is released', async () => {
    styleBody({ inline: 'padding-right: 20px;' })
    const setLocked = mountLockers()
    const before = measure()

    await setLocked(0, true)
    const locked = measure()
    expect(locked.paddingRight).toBe(`${20 + GAP}px`)

    await setLocked(1, true)
    expect(measure()).toEqual(locked)

    await setLocked(0, false)
    expect(measure()).toEqual(locked)

    await setLocked(1, false)
    expect(measure()).toEqual(before)
  })

  it('leaves the padding of another scroll lock that is already holding the body', async () => {
    // The other lock has hidden the scrollbar, so there is no gap left.
    gap = 0
    styleBody({ inline: 'overflow: hidden; padding-right: 35px;' })
    const setLocked = mountLockers()
    const before = measure()

    await setLocked(0, true)
    expect(measure()).toMatchObject({ paddingRight: '35px', left: before.left, right: before.right })

    await setLocked(0, false)
    expect(measure()).toEqual(before)
  })

  it('leaves the padding and margin alone with scrollBody false', async () => {
    styleBody({ css: 'body { padding-right: 40px; margin-right: 24px }' })
    const setLocked = mountLockers(false)
    const before = measure()

    await setLocked(0, true)
    expect(document.body.style.overflow).toBe('hidden')
    expect(measure()).toMatchObject({ ...before, inline: expect.not.stringMatching(/padding|margin/) })

    await setLocked(0, false)
    expect(measure()).toEqual(before)
  })

  it('adds the scrollbar gap to the margin with scrollBody { margin: true }', async () => {
    styleBody({ css: 'body { padding-right: 40px }', inline: 'margin-right: 24px;' })
    const setLocked = mountLockers({ padding: false, margin: true })
    const before = measure()

    await setLocked(0, true)
    const locked = measure()
    expect(locked).toMatchObject({ paddingRight: '40px', marginRight: `${24 + GAP}px` })
    expect(locked.left).toBe(before.left)
    expect(locked.right).toBe(before.right - GAP)

    await setLocked(0, false)
    expect(measure()).toEqual(before)
  })

  it('applies a scrollBody padding value as written', async () => {
    styleBody({ css: 'body { padding-right: 40px }' })
    const setLocked = mountLockers({ padding: 10 })
    const before = measure()

    await setLocked(0, true)
    expect(measure()).toMatchObject({ paddingRight: '10px', marginRight: '0px', right: before.right + 30 })

    await setLocked(0, false)
    expect(measure()).toEqual(before)
  })
})
