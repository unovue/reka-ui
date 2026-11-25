import type { SliderAreaRootProps } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SliderAreaArea, SliderAreaRoot, SliderAreaThumb } from '.'

function mountSliderArea(props: SliderAreaRootProps = {}) {
  const commits: number[][][] = []
  const Fixture = defineComponent({
    setup() {
      const value = ref([[20, 20]])
      return () => h(SliderAreaRoot, {
        ...props,
        'modelValue': value.value,
        'onUpdate:modelValue': (next: number[][] | undefined) => { value.value = next ?? [] },
        'onValueCommit': (next: number[][]) => { commits.push(next) },
        'data-testid': 'root',
        'style': 'position: relative; display: block; width: 200px; height: 200px; margin: 40px; touch-action: none;',
      }, () => [
        h(SliderAreaArea, { style: 'display: block; width: 100%; height: 100%;' }),
        h(SliderAreaThumb, { 'aria-label': 'Position', 'style': 'display: block; width: 20px; height: 20px;' }),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  const root = document.querySelector<HTMLElement>('[data-testid="root"]')!
  const thumb = document.querySelector<HTMLElement>('[role="slider"]')!
  return { root, thumb, commits }
}

// Chrome can release capture before `pointerup`, which then lands wherever the pointer is.
// Releasing capture and stopping `pointerup` before it reaches the area reproduces a release
// off the area, so only `lostpointercapture` can end the slide.
function loseCaptureBeforePointerUp() {
  const release = (event: PointerEvent) => {
    const target = event.target as HTMLElement
    if (target.hasPointerCapture(event.pointerId))
      target.releasePointerCapture(event.pointerId)
    event.stopPropagation()
  }
  window.addEventListener('pointerup', release, true)
  return () => window.removeEventListener('pointerup', release, true)
}

describe('given a SliderArea, in a real browser', () => {
  let restore = () => {}

  afterEach(() => restore())

  it('commits a plain drag once', async () => {
    const { root, thumb, commits } = mountSliderArea()

    await userEvent.dragAndDrop(thumb, root, { targetPosition: { x: 100, y: 120 }, steps: 10 })

    expect(commits).toEqual([[[50, 60]]])
  })

  it('commits a drag whose thumb loses pointer capture before pointerup', async () => {
    const { root, thumb, commits } = mountSliderArea()
    restore = loseCaptureBeforePointerUp()

    await userEvent.dragAndDrop(thumb, root, { targetPosition: { x: 100, y: 120 }, steps: 10 })

    expect(commits).toEqual([[[50, 60]]])
  })

  it('reads where the area is now on the drag after one that lost capture', async () => {
    const { root, thumb } = mountSliderArea()
    restore = loseCaptureBeforePointerUp()
    await userEvent.dragAndDrop(thumb, root, { targetPosition: { x: 100, y: 120 }, steps: 10 })
    restore()
    // The area moves between the two drags, as when the page scrolls or reflows.
    root.style.marginTop = '100px'

    await userEvent.dragAndDrop(thumb, root, { targetPosition: { x: 40, y: 40 }, steps: 10 })

    const rootRect = root.getBoundingClientRect()
    const thumbRect = thumb.getBoundingClientRect()
    expect(Math.abs(thumbRect.left + thumbRect.width / 2 - (rootRect.left + 40))).toBeLessThanOrEqual(2)
    expect(Math.abs(thumbRect.top + thumbRect.height / 2 - (rootRect.top + 40))).toBeLessThanOrEqual(2)
  })

  it('keeps the grabbed point of a contained thumb under the pointer on the drag after one that lost capture', async () => {
    const { root, thumb } = mountSliderArea({ thumbAlignment: 'contain' })
    restore = loseCaptureBeforePointerUp()
    await userEvent.dragAndDrop(thumb, root, { sourcePosition: { x: 18, y: 18 }, targetPosition: { x: 140, y: 140 }, steps: 10 })
    restore()

    await userEvent.dragAndDrop(thumb, root, { sourcePosition: { x: 2, y: 2 }, targetPosition: { x: 100, y: 100 }, steps: 10 })

    const rootRect = root.getBoundingClientRect()
    const thumbRect = thumb.getBoundingClientRect()
    expect(Math.abs(thumbRect.left + 2 - (rootRect.left + 100))).toBeLessThanOrEqual(2)
    expect(Math.abs(thumbRect.top + 2 - (rootRect.top + 100))).toBeLessThanOrEqual(2)
  })
})
