import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, numberFieldElements, pinInputElements, ratingElements, sliderElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([numberFieldElements, pinInputElements, sliderElements, ratingElements])
})
afterEach(cleanup)

function track(el: Element, type: string) {
  const values: unknown[] = []
  el.addEventListener(type, event => values.push((event as RekaElementEvent).detail.value))
  return values
}

describe('number field elements', () => {
  const FIELD = `
    <form onsubmit="return false">
      <reka-number-field-root name="quantity" default-value="5" min="0" max="10">
        <reka-number-field-decrement aria-label="Less">−</reka-number-field-decrement>
        <reka-number-field-input><input aria-label="Quantity"></reka-number-field-input>
        <reka-number-field-increment aria-label="More">+</reka-number-field-increment>
      </reka-number-field-root>
    </form>
  `

  it('renders the input part onto the native `<input>` inside it', async () => {
    render(FIELD)
    const input = query<HTMLInputElement>('reka-number-field-input input')
    await vi.waitFor(() => expect(input.value).toBe('5'))
    expect(input.getAttribute('role')).toBe('spinbutton')
    expect(input.getAttribute('aria-valuenow')).toBe('5')
    expect(input.getAttribute('aria-label')).toBe('Quantity')
    // The element itself stays a plain container.
    expect(query('reka-number-field-input').hasAttribute('role')).toBe(false)
  })

  it('creates the `<input>` when there is none', async () => {
    render(`<reka-number-field-root default-value="2"><reka-number-field-input aria-label="n"></reka-number-field-input></reka-number-field-root>`)
    await vi.waitFor(() => expect(query<HTMLInputElement>('reka-number-field-input > input').value).toBe('2'))
  })

  it('steps with the arrow keys and the buttons, typed values commit, and dispatches `update-model-value`', async () => {
    render(FIELD)
    const root = query('reka-number-field-root')
    const input = query<HTMLInputElement>('reka-number-field-input input')
    await vi.waitFor(() => expect(input.value).toBe('5'))
    const values = track(root, 'update-model-value')

    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')
    expect(input.value).toBe('6')
    await userEvent.keyboard('{End}')
    expect(input.value).toBe('10')
    await userEvent.click(query('reka-number-field-decrement'))
    expect(input.value).toBe('9')
    expect(query('reka-number-field-increment').getAttribute('role')).toBe('button')

    await userEvent.clear(input)
    await userEvent.type(input, '3{Enter}')
    await vi.waitFor(() => expect(input.value).toBe('3'))
    expect(values).toEqual([6, 10, 9, 3])
  })

  it('submits with its form and resets to its default', async () => {
    const container = render(FIELD)
    const form = container.querySelector('form')!
    const input = query<HTMLInputElement>('reka-number-field-input input')
    await vi.waitFor(() => expect(new FormData(form).get('quantity')).toBe('5'))
    // The visible input has no `name`: only the element submits.
    expect(new FormData(form).getAll('quantity')).toEqual(['5'])

    await userEvent.click(query('reka-number-field-increment'))
    await vi.waitFor(() => expect(new FormData(form).get('quantity')).toBe('6'))
    form.reset()
    await vi.waitFor(() => expect(input.value).toBe('5'))
    await vi.waitFor(() => expect(new FormData(form).get('quantity')).toBe('5'))
  })

  it('gives back the input as it was when it unmounts', async () => {
    const container = render(`<reka-number-field-root default-value="1"><reka-number-field-input><input aria-label="n" class="mine"></reka-number-field-input></reka-number-field-root>`)
    const input = query<HTMLInputElement>('input')
    await vi.waitFor(() => expect(input.getAttribute('role')).toBe('spinbutton'))
    container.firstElementChild!.remove()
    await vi.waitFor(() => expect(input.hasAttribute('role')).toBe(false))
    expect(input.getAttribute('aria-label')).toBe('n')
    expect(input.className).toBe('mine')
  })
})

describe('pin input elements', () => {
  const PIN = `
    <form onsubmit="return false">
      <reka-pin-input-root name="code" aria-label="Code">
        <reka-pin-input-input index="0"><input aria-label="1"></reka-pin-input-input>
        <reka-pin-input-input index="1"><input aria-label="2"></reka-pin-input-input>
        <reka-pin-input-input index="2"><input aria-label="3"></reka-pin-input-input>
      </reka-pin-input-root>
    </form>
  `

  it('moves through its inputs while typing, completes and submits the code', async () => {
    const container = render(PIN)
    const root = query('reka-pin-input-root')
    const inputs = [...document.querySelectorAll<HTMLInputElement>('reka-pin-input-input input')]
    await vi.waitFor(() => expect(inputs[0].hasAttribute('data-reka-owned')).toBe(true))
    const completed = track(root, 'complete')

    await userEvent.click(inputs[0])
    await userEvent.keyboard('123')
    expect(inputs.map(input => input.value)).toEqual(['1', '2', '3'])
    expect(document.activeElement).toBe(inputs[2])
    expect(completed).toEqual([['1', '2', '3']])
    await vi.waitFor(() => expect(new FormData(container.querySelector('form')!).get('code')).toBe('123'))

    await userEvent.keyboard('{Backspace}{ArrowLeft}')
    expect(inputs[2].value).toBe('')
    expect(document.activeElement).toBe(inputs[1])
  })
})

describe('slider elements', () => {
  const SLIDER = `
    <form onsubmit="return false">
      <reka-slider-root name="volume" style="display: flex; position: relative; width: 200px; height: 20px">
        <reka-slider-track style="display: block; position: relative; flex-grow: 1; height: 4px"><reka-slider-range style="display: block; position: absolute; height: 100%"></reka-slider-range></reka-slider-track>
        <reka-slider-thumb aria-label="Volume" style="display: block; width: 10px; height: 10px"></reka-slider-thumb>
      </reka-slider-root>
    </form>
  `
  type SliderElement = HTMLElement & { defaultValue?: number[], modelValue?: number[] }

  function renderSlider(value = '50') {
    const container = render(SLIDER.replace('name="volume"', `name="volume" default-value="${value}"`))
    return { container, root: query<SliderElement>('reka-slider-root') }
  }

  it('wires the thumb as a slider and moves with the keyboard', async () => {
    const { root } = renderSlider()
    const thumb = query('reka-slider-thumb')
    await vi.waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('50'))
    expect(thumb.getAttribute('role')).toBe('slider')
    expect(thumb.getAttribute('aria-orientation')).toBe('horizontal')
    const values = track(root, 'update-model-value')
    const commits = track(root, 'value-commit')

    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('51')
    await userEvent.keyboard('{PageDown}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('41')
    await userEvent.keyboard('{Home}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('0')
    expect(values).toEqual([[51], [41], [0]])
    expect(commits).toEqual([[51], [41], [0]])
    expect(query('reka-slider-range').style.right).toBe('100%')
  })

  it('moves to where the track is pressed', async () => {
    const { root } = renderSlider('0')
    const thumb = query('reka-slider-thumb')
    await vi.waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('0'))
    const values = track(root, 'update-model-value')
    const rect = root.getBoundingClientRect()
    await userEvent.click(root, { position: { x: rect.width * 0.75, y: rect.height / 2 } })
    await vi.waitFor(() => expect(Number(thumb.getAttribute('aria-valuenow'))).toBeGreaterThan(60))
    expect(Number(thumb.getAttribute('aria-valuenow'))).toBeLessThan(90)
    expect(document.activeElement).toBe(thumb)
    expect(values.length).toBeGreaterThan(0)
  })

  it('takes a controlled array model as a property and submits its value', async () => {
    const { container, root } = renderSlider()
    const thumb = query('reka-slider-thumb')
    await vi.waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('50'))
    const form = container.querySelector('form')!
    // The same names as the Vue component: one field per thumb.
    await vi.waitFor(() => expect(new FormData(form).get('volume[0]')).toBe('50'))

    root.modelValue = [20]
    await vi.waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('20'))
    await vi.waitFor(() => expect(new FormData(form).get('volume[0]')).toBe('20'))
    // Controlled: the key reports the change, the value waits for the consumer.
    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('20')
  })

  it('keeps one thumb per value, in DOM order (`default-value="10 90"`)', async () => {
    const container = render(`
      <reka-slider-root default-value="10 90" style="display: flex; position: relative; width: 200px; height: 20px">
        <reka-slider-thumb aria-label="Min" style="display: block; width: 10px; height: 10px"></reka-slider-thumb>
        <reka-slider-thumb aria-label="Max" style="display: block; width: 10px; height: 10px"></reka-slider-thumb>
      </reka-slider-root>
    `)
    const [min, max] = container.querySelectorAll<HTMLElement>('reka-slider-thumb')
    await vi.waitFor(() => expect(max.getAttribute('aria-valuenow')).toBe('90'))
    expect(min.getAttribute('aria-valuenow')).toBe('10')
    max.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(max.getAttribute('aria-valuenow')).toBe('91')
    expect(min.getAttribute('aria-valuenow')).toBe('10')
    // Home and End move the first and the last value.
    await userEvent.keyboard('{Home}')
    expect(min.getAttribute('aria-valuenow')).toBe('0')
    expect(max.getAttribute('aria-valuenow')).toBe('91')
  })
})

describe('rating elements', () => {
  const RATING = `
    <form onsubmit="return false">
      <reka-rating-root name="score" default-value="2" aria-label="Score">
        ${[1, 2, 3, 4, 5].map(item => `<reka-rating-item item="${item}"><reka-rating-item-indicator step="${item}" aria-label="${item} stars">★</reka-rating-item-indicator></reka-rating-item>`).join('')}
      </reka-rating-root>
    </form>
  `

  it('is a radio group: click and arrow keys rate, and the value submits', async () => {
    const container = render(RATING)
    const root = query('reka-rating-root')
    const stars = [...document.querySelectorAll<HTMLElement>('reka-rating-item-indicator')]
    await vi.waitFor(() => expect(stars[1].getAttribute('aria-checked')).toBe('true'))
    expect(root.getAttribute('role')).toBe('radiogroup')
    expect(stars[0].getAttribute('role')).toBe('radio')
    const values = track(root, 'update-model-value')
    const form = container.querySelector('form')!
    await vi.waitFor(() => expect(new FormData(form).get('score')).toBe('2'))

    await userEvent.click(stars[3])
    await vi.waitFor(() => expect(stars[3].getAttribute('aria-checked')).toBe('true'))
    expect(stars[2].getAttribute('data-state')).toBe('checked')
    // A radio checks once focused while the arrow key is still down.
    await userEvent.keyboard('{ArrowLeft>}')
    await vi.waitFor(() => expect(stars[2].getAttribute('aria-checked')).toBe('true'))
    await userEvent.keyboard('{/ArrowLeft}')
    expect(document.activeElement).toBe(stars[2])
    expect(values).toEqual([4, 3])
    await vi.waitFor(() => expect(new FormData(form).get('score')).toBe('3'))
  })
})
