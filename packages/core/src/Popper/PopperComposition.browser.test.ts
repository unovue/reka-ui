import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DropdownMenuContent, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

const families = {
  Popover: { FloatingRoot: PopoverRoot, FloatingTrigger: PopoverTrigger, FloatingPortal: PopoverPortal, FloatingContent: PopoverContent },
  DropdownMenu: { FloatingRoot: DropdownMenuRoot, FloatingTrigger: DropdownMenuTrigger, FloatingPortal: DropdownMenuPortal, FloatingContent: DropdownMenuContent },
}

function mountComposition(family: keyof typeof families, order: 'tooltip-first' | 'floating-first' | 'anchor') {
  const { FloatingRoot, FloatingTrigger, FloatingPortal, FloatingContent } = families[family]
  const triggerProps = { 'data-testid': 'trigger', 'style': 'width: 100px; height: 30px' }

  mount(defineComponent({
    setup() {
      function trigger() {
        if (order === 'floating-first')
          return h(FloatingTrigger, { asChild: true }, () => h(TooltipTrigger, triggerProps, () => 'Open'))

        const composed = () => h(TooltipTrigger, { asChild: true }, () => h(FloatingTrigger, triggerProps, () => 'Open'))
        return order === 'anchor' ? h(PopoverAnchor, { asChild: true }, composed) : composed()
      }

      return () => h('div', { style: 'padding: 200px' }, [
        h(TooltipProvider, { delayDuration: 0 }, () => h(FloatingRoot, { modal: false }, () => [
          h(TooltipRoot, null, () => [
            trigger(),
            h(TooltipPortal, null, () => h(TooltipContent, { side: 'top' }, () => 'Tooltip')),
          ]),
          h(FloatingPortal, null, () => h(FloatingContent, {
            'data-testid': 'content',
            'side': 'bottom',
            'sideOffset': 8,
            'style': 'width: 150px; height: 50px',
          }, () => 'Content')),
        ])),
      ])
    },
  }), { attachTo: document.body })
}

async function expectPositioned() {
  const trigger = document.querySelector<HTMLElement>('[data-testid="trigger"]')!
  await userEvent.click(trigger)

  await expect.poll(() => {
    const content = document.querySelector<HTMLElement>('[data-testid="content"]')
    return content && Math.round(content.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom)
  }).toBe(8)
}

describe('floating triggers inside TooltipRoot', () => {
  describe.each(['Popover', 'DropdownMenu'] as const)('%s', (family) => {
    it('positions content with TooltipTrigger outside the floating trigger', async () => {
      mountComposition(family, 'tooltip-first')

      await expectPositioned()
    })

    it('positions content with TooltipTrigger inside the floating trigger', async () => {
      mountComposition(family, 'floating-first')

      await expectPositioned()
    })
  })

  it('positions content with a custom PopoverAnchor inside TooltipRoot', async () => {
    mountComposition('Popover', 'anchor')

    await expectPositioned()
  })
})
