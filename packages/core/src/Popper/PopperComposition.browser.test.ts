import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { AutocompleteAnchor, AutocompleteContent, AutocompletePortal, AutocompleteRoot, AutocompleteTrigger } from '@/Autocomplete'
import { ComboboxAnchor, ComboboxContent, ComboboxPortal, ComboboxRoot, ComboboxTrigger } from '@/Combobox'
import { DropdownMenuContent, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectPortal, SelectRoot, SelectTrigger } from '@/Select'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

interface FloatingFamily {
  FloatingRoot: Component
  FloatingTrigger: Component
  FloatingPortal: Component
  FloatingContent: Component
  FloatingAnchor?: Component
  contentProps?: Record<string, unknown>
}

const families = {
  Popover: { FloatingRoot: PopoverRoot, FloatingTrigger: PopoverTrigger, FloatingPortal: PopoverPortal, FloatingContent: PopoverContent },
  DropdownMenu: { FloatingRoot: DropdownMenuRoot, FloatingTrigger: DropdownMenuTrigger, FloatingPortal: DropdownMenuPortal, FloatingContent: DropdownMenuContent },
  HoverCard: { FloatingRoot: HoverCardRoot, FloatingTrigger: HoverCardTrigger, FloatingPortal: HoverCardPortal, FloatingContent: HoverCardContent },
  Select: { FloatingRoot: SelectRoot, FloatingTrigger: SelectTrigger, FloatingPortal: SelectPortal, FloatingContent: SelectContent, contentProps: { position: 'popper' } },
  Combobox: { FloatingRoot: ComboboxRoot, FloatingTrigger: ComboboxTrigger, FloatingPortal: ComboboxPortal, FloatingContent: ComboboxContent, FloatingAnchor: ComboboxAnchor, contentProps: { position: 'popper' } },
  Autocomplete: { FloatingRoot: AutocompleteRoot, FloatingTrigger: AutocompleteTrigger, FloatingPortal: AutocompletePortal, FloatingContent: AutocompleteContent, FloatingAnchor: AutocompleteAnchor, contentProps: { position: 'popper' } },
} satisfies Record<string, FloatingFamily>

function mountComposition(
  family: keyof typeof families,
  order: 'tooltip-first' | 'floating-first' | 'anchor',
  options: { open?: boolean, contentInsideTooltip?: boolean } = {},
) {
  const { FloatingRoot, FloatingTrigger, FloatingPortal, FloatingContent, FloatingAnchor, contentProps }: FloatingFamily = families[family]
  const triggerProps = { 'data-testid': 'trigger', 'style': 'width: 100px; height: 30px' }

  mount(defineComponent({
    setup() {
      function floatingTrigger() {
        const button = () => h(FloatingTrigger, triggerProps, () => 'Open')
        return FloatingAnchor ? h(FloatingAnchor, { asChild: true }, button) : button()
      }

      function trigger() {
        if (order === 'floating-first')
          return h(FloatingTrigger, { asChild: true }, () => h(TooltipTrigger, triggerProps, () => 'Open'))

        const composed = () => h(TooltipTrigger, { asChild: true }, floatingTrigger)
        return order === 'anchor' ? h(PopoverAnchor, { asChild: true }, composed) : composed()
      }

      const content = () => h(FloatingPortal, null, () => h(FloatingContent, {
        ...contentProps,
        'data-testid': 'content',
        'side': 'bottom',
        'sideOffset': 8,
        'style': 'width: 150px; height: 50px',
      }, () => 'Content'))

      return () => h('div', { style: 'padding: 200px' }, [
        h(TooltipProvider, { delayDuration: 0 }, () => h(FloatingRoot, { modal: false, open: options.open }, () => [
          h(TooltipRoot, null, () => [
            trigger(),
            h(TooltipPortal, null, () => h(TooltipContent, { side: 'top' }, () => 'Tooltip')),
            options.contentInsideTooltip ? content() : null,
          ]),
          options.contentInsideTooltip ? null : content(),
        ])),
      ])
    },
  }), { attachTo: document.body })
}

async function expectPositioned(clickTrigger = true) {
  const trigger = document.querySelector<HTMLElement>('[data-testid="trigger"]')!
  if (clickTrigger)
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

  it.each(Object.keys(families) as Array<keyof typeof families>)('positions %s when both anchor and content are inside TooltipRoot', async (family) => {
    mountComposition(family, 'tooltip-first', { open: true, contentInsideTooltip: true })

    await expectPositioned(false)
  })

  it('positions a tooltip whose trigger and content are inside PopoverRoot', async () => {
    mount(() => h('div', { style: 'padding: 200px' }, [
      h(TooltipProvider, null, () => h(TooltipRoot, { open: true }, () => h(PopoverRoot, null, () => [
        h(TooltipTrigger, { 'data-testid': 'trigger' }, () => 'Trigger'),
        h(TooltipPortal, null, () => h(TooltipContent, {
          'data-testid': 'content',
          'side': 'bottom',
          'sideOffset': 8,
        }, () => 'Tooltip')),
      ]))),
    ]), { attachTo: document.body })

    await expectPositioned(false)
  })

  it('positions a submenu whose trigger is inside TooltipRoot', async () => {
    mount(() => h('div', { style: 'padding: 200px' }, [
      h(TooltipProvider, null, () => h(DropdownMenuRoot, { open: true, modal: false }, () => [
        h(DropdownMenuTrigger, null, () => 'Open'),
        h(DropdownMenuPortal, null, () => h(DropdownMenuContent, null, () =>
          h(DropdownMenuSub, { open: true }, () => h(TooltipRoot, null, () => [
            h(TooltipTrigger, { asChild: true }, () => h(DropdownMenuSubTrigger, {
              'data-testid': 'trigger',
              'style': 'width: 100px; height: 30px',
            }, () => 'Submenu')),
            h(DropdownMenuPortal, null, () => h(DropdownMenuSubContent, {
              'data-testid': 'content',
              'sideOffset': 8,
              'avoidCollisions': false,
              'style': 'width: 100px; height: 50px',
            }, () => 'Submenu content')),
          ])))),
      ])),
    ]), { attachTo: document.body })

    await expect.poll(() => {
      const trigger = document.querySelector<HTMLElement>('[data-testid="trigger"]')
      const content = document.querySelector<HTMLElement>('[data-testid="content"]')
      return trigger && content && Math.round(content.getBoundingClientRect().left - trigger.getBoundingClientRect().right)
    }).toBe(8)
  })
})
