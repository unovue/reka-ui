import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '.'

function mountSlider() {
  const commits: number[][] = []
  const Fixture = defineComponent({
    setup() {
      const value = ref([20, 80])
      return () => h(SliderRoot, {
        'modelValue': value.value,
        'onUpdate:modelValue': (next: number[] | undefined) => { value.value = next ?? [] },
        'onValueCommit': (next: number[]) => { commits.push(next) },
        'data-testid': 'root',
        'style': 'position: relative; display: flex; align-items: center; width: 200px; height: 20px; margin: 40px;',
      }, () => [
        h(SliderTrack, { style: 'position: relative; flex-grow: 1; height: 4px;' }, () => h(SliderRange)),
        h(SliderThumb, { 'aria-label': 'Minimum', 'style': 'display: block; width: 20px; height: 20px;' }),
        h(SliderThumb, { 'aria-label': 'Maximum', 'style': 'display: block; width: 20px; height: 20px;' }),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  const root = document.querySelector<HTMLElement>('[data-testid="root"]')!
  const thumbs = [...document.querySelectorAll<HTMLElement>('[role="slider"]')]
  return { root, thumbs, commits }
}

// Chrome can fire `lostpointercapture` before `pointerup`; releasing capture from a
// capture-phase `pointerup` listener reproduces that order.
function loseCaptureBeforePointerUp() {
  const release = (event: PointerEvent) => {
    const target = event.target as HTMLElement
    if (target.hasPointerCapture(event.pointerId))
      target.releasePointerCapture(event.pointerId)
  }
  window.addEventListener('pointerup', release, true)
  return () => window.removeEventListener('pointerup', release, true)
}

describe('given a range Slider, in a real browser', () => {
  let restore = () => {}

  afterEach(() => restore())

  it('commits a drag whose thumb loses pointer capture before pointerup', async () => {
    const { root, thumbs, commits } = mountSlider()
    restore = loseCaptureBeforePointerUp()

    await userEvent.dragAndDrop(thumbs[1]!, root, { targetPosition: { x: 100, y: 10 }, steps: 10 })

    expect(commits).toHaveLength(1)
    expect(commits[0]![1]).toBeLessThan(80)
  })

  it('keeps the grabbed point of the thumb under the pointer on the drag after one that lost capture', async () => {
    const { root, thumbs } = mountSlider()
    restore = loseCaptureBeforePointerUp()
    await userEvent.dragAndDrop(thumbs[1]!, root, { sourcePosition: { x: 18, y: 10 }, targetPosition: { x: 140, y: 10 }, steps: 10 })
    restore()

    await userEvent.dragAndDrop(thumbs[1]!, root, { sourcePosition: { x: 2, y: 10 }, targetPosition: { x: 120, y: 10 }, steps: 10 })

    const pointerX = root.getBoundingClientRect().left + 120
    const grabbedX = thumbs[1]!.getBoundingClientRect().left + 2
    expect(Math.abs(grabbedX - pointerX)).toBeLessThanOrEqual(2)
  })
})
