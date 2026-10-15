import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import TooltipContent from '@/Tooltip/TooltipContent.vue'
import TooltipPortal from '@/Tooltip/TooltipPortal.vue'
import TooltipProvider from '@/Tooltip/TooltipProvider.vue'
import TooltipRoot from '@/Tooltip/TooltipRoot.vue'
import TooltipTrigger from '@/Tooltip/TooltipTrigger.vue'

const TooltipWithConstrainedBoundary = defineComponent({
  setup() {
    const boundary = ref<HTMLElement>()

    return () => h('div', {
      'ref': boundary,
      'data-testid': 'boundary',
      'style': 'position: fixed; top: 100px; left: 100px; width: 240px; height: 240px',
    }, [
      h(TooltipProvider, null, {
        default: () => h(TooltipRoot, { defaultOpen: true }, {
          default: () => [
            h(TooltipTrigger, {
              style: 'position: absolute; top: 100px; left: 0; width: 100%; height: 20px',
            }, () => 'Full-width trigger'),
            h(TooltipPortal, null, {
              default: () => h(TooltipContent, {
                'data-testid': 'tooltip',
                'side': 'right',
                'sideOffset': 8,
                'collisionBoundary': boundary.value,
                'style': 'box-sizing: border-box; width: 160px; height: 40px',
              }, () => 'Tooltip'),
            }),
          ],
        }),
      }),
    ])
  },
})

describe('popper browser positioning', () => {
  it('tries perpendicular sides when neither side of the preferred axis fits', async () => {
    const wrapper = mount(TooltipWithConstrainedBoundary, { attachTo: document.body })
    const boundary = wrapper.get('[data-testid="boundary"]').element
    await vi.waitFor(() => {
      const tooltip = document.querySelector<HTMLElement>('[data-testid="tooltip"]')
      expect(tooltip).not.toBeNull()
      expect(tooltip?.dataset.side).toMatch(/^(top|bottom)$/)
    })

    const tooltip = document.querySelector<HTMLElement>('[data-testid="tooltip"]')!
    const boundaryRect = boundary.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    expect(tooltipRect.left).toBeGreaterThanOrEqual(boundaryRect.left)
    expect(tooltipRect.right).toBeLessThanOrEqual(boundaryRect.right)
    expect(tooltipRect.top).toBeGreaterThanOrEqual(boundaryRect.top)
    expect(tooltipRect.bottom).toBeLessThanOrEqual(boundaryRect.bottom)
  })
})
