import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { DropdownMenuContent, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'
import PopperAnchor from './PopperAnchor.vue'
import PopperContent from './PopperContent.vue'
import PopperRoot from './PopperRoot.vue'

// A full-width anchor inside a 240px boundary: 160px content fits neither on the
// right nor on the left of it, but fits above and below.
const boundaryStyle = 'position: fixed; top: 100px; left: 100px; width: 240px; height: 240px'
const anchorStyle = 'position: absolute; top: 100px; left: 0; width: 100%; height: 20px; padding: 0; border: 0'
const contentStyle = 'box-sizing: border-box; width: 160px; height: 40px'
const POLL = { timeout: 5000 }

type Family = 'Tooltip' | 'Popover' | 'DropdownMenu' | 'Popper'

/**
 * Mount `side="right"` content of the given family against the full-width anchor.
 */
function mountConstrained(family: Family, contentProps: Record<string, unknown> = {}) {
  return mount(defineComponent({
    setup() {
      const boundary = ref<HTMLElement>()
      const content = () => ({
        'data-testid': 'content',
        'side': 'right',
        'sideOffset': 8,
        'collisionBoundary': boundary.value,
        'style': contentStyle,
        ...contentProps,
      })

      const families: Record<Family, () => any> = {
        Tooltip: () => h(TooltipProvider, null, () => h(TooltipRoot, { open: true }, () => [
          h(TooltipTrigger, { 'data-testid': 'anchor', 'style': anchorStyle }, () => 'Anchor'),
          h(TooltipPortal, null, () => h(TooltipContent, content(), () => 'Content')),
        ])),
        Popover: () => h(PopoverRoot, { open: true }, () => [
          h(PopoverTrigger, { 'data-testid': 'anchor', 'style': anchorStyle }, () => 'Anchor'),
          h(PopoverPortal, null, () => h(PopoverContent, content(), () => 'Content')),
        ]),
        DropdownMenu: () => h(DropdownMenuRoot, { open: true, modal: false }, () => [
          h(DropdownMenuTrigger, { 'data-testid': 'anchor', 'style': anchorStyle }, () => 'Anchor'),
          h(DropdownMenuPortal, null, () => h(DropdownMenuContent, content(), () => 'Content')),
        ]),
        Popper: () => h(PopperRoot, null, () => [
          h(PopperAnchor, { 'data-testid': 'anchor', 'style': anchorStyle }, () => 'Anchor'),
          h(PopperContent, content(), () => 'Content'),
        ]),
      }

      return () => h('div', { 'ref': boundary, 'data-testid': 'boundary', 'style': boundaryStyle }, [families[family]()])
    },
  }), { attachTo: document.body })
}

const getContent = () => document.querySelector<HTMLElement>('[data-testid="content"]')
const getRect = (testId: string) => document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)!.getBoundingClientRect()

/** Wait until the content is positioned (the wrapper leaves its offscreen starting transform). */
async function waitForPlaced() {
  await expect.poll(() => {
    const wrapper = getContent()?.closest<HTMLElement>('[data-reka-popper-content-wrapper]')
    return !!wrapper && !wrapper.style.transform.includes('-200%')
  }, POLL).toBe(true)
}

describe('popper perpendicular-side fallback', () => {
  describe.each(['Tooltip', 'Popover', 'DropdownMenu', 'Popper'] as const)('%s', (family) => {
    it('stays on the preferred axis by default when neither side of it fits', async () => {
      mountConstrained(family)
      await waitForPlaced()

      // Give a late re-placement the chance to happen before asserting it did not.
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(getContent()!.dataset.side).toBe('right')
      expect(Math.round(getRect('content').left - getRect('anchor').right)).toBe(8)
    })

    it('moves to a perpendicular side that fits when fallbackAxisSideDirection is set', async () => {
      mountConstrained(family, { fallbackAxisSideDirection: 'start' })

      await expect.poll(() => getContent()?.dataset.side, POLL).toBe('top')

      const boundary = getRect('boundary')
      const content = getRect('content')
      expect(Math.round(getRect('anchor').top - content.bottom)).toBe(8)
      expect(content.left).toBeGreaterThanOrEqual(boundary.left)
      expect(content.right).toBeLessThanOrEqual(boundary.right)
      expect(content.top).toBeGreaterThanOrEqual(boundary.top)
      expect(content.bottom).toBeLessThanOrEqual(boundary.bottom)
    })
  })

  it('tries the bottom side first with fallbackAxisSideDirection="end"', async () => {
    mountConstrained('Tooltip', { fallbackAxisSideDirection: 'end' })

    await expect.poll(() => getContent()?.dataset.side, POLL).toBe('bottom')
  })

  it('does not apply when sideFlip is disabled', async () => {
    mountConstrained('Popover', { fallbackAxisSideDirection: 'start', sideFlip: false })
    await waitForPlaced()

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(getContent()!.dataset.side).toBe('right')
  })

  it('does not apply when avoidCollisions is disabled', async () => {
    mountConstrained('Tooltip', { fallbackAxisSideDirection: 'start', avoidCollisions: false })
    await waitForPlaced()

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(getContent()!.dataset.side).toBe('right')
  })
})
