import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  aspectRatioElements,
  avatarElements,
  defineRekaElements,
  progressElements,
  separatorElements,
  visuallyHiddenElements,
} from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([aspectRatioElements, avatarElements, progressElements, separatorElements, visuallyHiddenElements])
})
afterEach(cleanup)

describe('aspect ratio element', () => {
  it('sizes a wrapper that takes its place, and fills it', async () => {
    const container = render(`
      <div style="width: 320px">
        <reka-aspect-ratio ratio="1.7778" class="media"><span>16:9</span></reka-aspect-ratio>
      </div>
    `)
    const el = query('reka-aspect-ratio')
    await vi.waitFor(() => expect(el.parentElement).not.toBe(container.firstElementChild))
    const wrapper = el.parentElement!
    expect(wrapper.parentElement).toBe(container.firstElementChild)
    expect(wrapper.getBoundingClientRect().height).toBeCloseTo(180, 0)
    expect(el.style.position).toBe('absolute')
    expect(el.getBoundingClientRect().height).toBeCloseTo(180, 0)
    expect(el.classList.contains('media')).toBe(true)

    el.setAttribute('ratio', '2')
    await vi.waitFor(() => expect(wrapper.getBoundingClientRect().height).toBeCloseTo(160, 0))

    // Removed, the wrapper goes away with it.
    el.remove()
    await vi.waitFor(() => expect(container.querySelector(':scope > div > div')).toBeNull())
    expect(el.isConnected).toBe(false)
    // No home marker is left behind either.
    expect([...container.firstElementChild!.childNodes].some(node => node.nodeType === Node.COMMENT_NODE)).toBe(false)
  })
})

describe('avatar elements', () => {
  it('shows the fallback, after its delay', async () => {
    render(`
      <reka-avatar-root>
        <reka-avatar-fallback delay-ms="100">CT</reka-avatar-fallback>
      </reka-avatar-root>
    `)
    const fallback = query('reka-avatar-fallback')
    await vi.waitFor(() => expect(query('reka-avatar-root').hasAttribute('data-reka-unmounted')).toBe(false))
    expect(fallback.hasAttribute('data-reka-unmounted')).toBe(true)
    await vi.waitFor(() => expect(fallback.hasAttribute('data-reka-unmounted')).toBe(false))
    expect(fallback.textContent).toBe('CT')
  })
})

describe('separator element', () => {
  it('is a separator, or decorative', async () => {
    render(`
      <reka-separator orientation="vertical"></reka-separator>
      <reka-separator decorative id="decorative"></reka-separator>
    `)
    const [separator, decorative] = document.querySelectorAll<HTMLElement>('reka-separator')
    await vi.waitFor(() => expect(separator.getAttribute('role')).toBe('separator'))
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    expect(separator.getAttribute('data-orientation')).toBe('vertical')
    expect(decorative.getAttribute('role')).toBe('none')
    expect(decorative.id).toBe('decorative')
  })
})

describe('visually hidden element', () => {
  it('hides its content visually but keeps it in the accessibility tree', async () => {
    render(`<button id="save"><reka-visually-hidden>Save</reka-visually-hidden>💾</button>`)
    const el = query('reka-visually-hidden')
    await vi.waitFor(() => expect(el.style.position).toBe('absolute'))
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    expect(el.hasAttribute('aria-hidden')).toBe(false)

    el.setAttribute('feature', 'fully-hidden')
    await vi.waitFor(() => expect(el.getAttribute('aria-hidden')).toBe('true'))
    expect(el.getAttribute('tabindex')).toBe('-1')
  })
})

describe('progress elements', () => {
  it('exposes the value on the progressbar and the indicator', async () => {
    render(`
      <reka-progress-root model-value="30" aria-label="Upload">
        <reka-progress-indicator></reka-progress-indicator>
      </reka-progress-root>
    `)
    const root = query<HTMLElement & { modelValue?: number | null, getValueText?: unknown }>('reka-progress-root')
    const indicator = query('reka-progress-indicator')
    await vi.waitFor(() => expect(root.getAttribute('role')).toBe('progressbar'))
    expect(root.getAttribute('aria-valuenow')).toBe('30')
    expect(root.getAttribute('aria-valuemax')).toBe('100')
    expect(root.getAttribute('data-state')).toBe('loading')
    expect(indicator.getAttribute('data-value')).toBe('30')

    root.modelValue = 100
    await vi.waitFor(() => expect(root.getAttribute('data-state')).toBe('complete'))
    expect(indicator.getAttribute('data-state')).toBe('complete')

    // Function props are properties.
    root.getValueText = (value: number, max: number) => `${value} of ${max} files`
    await vi.waitFor(() => expect(root.getAttribute('aria-valuetext')).toBe('100 of 100 files'))
  })

  it('reports an invalid value corrected to `null`', async () => {
    render(`<reka-progress-root aria-label="Upload" max="50"></reka-progress-root>`)
    const root = query<HTMLElement & { modelValue?: number | null }>('reka-progress-root')
    await vi.waitFor(() => expect(root.getAttribute('role')).toBe('progressbar'))
    const onUpdate = vi.fn()
    root.addEventListener('update-model-value', event => onUpdate((event as RekaElementEvent).detail.value))
    root.modelValue = 80
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(null))
    expect(root.getAttribute('data-state')).toBe('indeterminate')
  })
})
