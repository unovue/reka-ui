import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import {
  ContextMenuArrow,
  ContextMenuContent,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/ContextMenu'
import {
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/DropdownMenu'
import {
  MenubarArrow,
  MenubarContent,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/Menubar'
import { PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'

// Every case is laid out inside a 300px square that is also the collision boundary,
// so the results do not depend on the size of the test viewport.
const BOUNDARY = 300
const boundaryStyle = `position: fixed; top: 50px; left: 50px; width: ${BOUNDARY}px; height: ${BOUNDARY}px`
const POLL = { timeout: 5000 }

/** Position of the anchor, relative to the boundary. */
interface Rect { left: number, top: number, width: number, height: number }

// `Popover` forwards every positioning prop, so it tells a broken fixture from a broken menu.
const ROOT_FAMILIES = ['Popover', 'DropdownMenu', 'Menubar'] as const
const SUB_FAMILIES = ['DropdownMenuSub', 'ContextMenuSub', 'MenubarSub'] as const
type Family = typeof ROOT_FAMILIES[number] | typeof SUB_FAMILIES[number] | 'ContextMenu'

interface Options {
  /**
   * Where the content is anchored: the trigger for the root families, the sub trigger
   * for the sub families, and the pointer position (`left`/`top`) for `ContextMenu`.
   */
  anchor: Rect
  /** Content size in px. */
  size: [width: number, height: number]
  props?: Record<string, unknown>
  arrow?: boolean
  /** Rendered inside the content. */
  slot?: () => unknown
}

function absolute({ left, top, width, height }: Rect) {
  return `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; padding: 0; border: 0; margin: 0`
}

const subParts = {
  DropdownMenuSub: { Sub: DropdownMenuSub, SubTrigger: DropdownMenuSubTrigger, SubContent: DropdownMenuSubContent, Portal: DropdownMenuPortal, Arrow: DropdownMenuArrow },
  ContextMenuSub: { Sub: ContextMenuSub, SubTrigger: ContextMenuSubTrigger, SubContent: ContextMenuSubContent, Portal: ContextMenuPortal, Arrow: ContextMenuArrow },
  MenubarSub: { Sub: MenubarSub, SubTrigger: MenubarSubTrigger, SubContent: MenubarSubContent, Portal: MenubarPortal, Arrow: MenubarArrow },
} as const

const get = (testId: string) => document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
const settle = () => new Promise(resolve => setTimeout(resolve, 150))

/** Wait until the content is positioned (the wrapper leaves its offscreen starting transform). */
async function waitForPlaced() {
  await expect.poll(() => {
    const wrapper = get('content')?.closest<HTMLElement>('[data-reka-popper-content-wrapper]')
    return !!wrapper && !wrapper.style.transform.includes('-200%')
  }, POLL).toBe(true)
  // Give a late re-placement the chance to happen before anything is asserted.
  await settle()
}

async function mountMenu(family: Family, { anchor, size, props = {}, arrow = false, slot }: Options) {
  const wrapper = mount(defineComponent({
    setup() {
      const boundary = ref<HTMLElement>()

      const content = () => ({
        'data-testid': 'content',
        'collisionBoundary': boundary.value,
        'style': `box-sizing: border-box; width: ${size[0]}px; height: ${size[1]}px`,
        ...props,
      })
      const children = (Arrow: any) => () => [
        arrow ? h(Arrow, { 'data-testid': 'arrow', 'width': 10, 'height': 5 }) : null,
        slot?.(),
      ]
      const trigger = { 'data-testid': 'anchor', 'style': absolute(anchor) }

      // A sub trigger that fills a parent content pinned right below the parent trigger,
      // so the sub trigger sits exactly on `anchor`.
      const parentTrigger = { 'data-testid': 'parent-trigger', 'style': absolute({ ...anchor, top: anchor.top - 20, height: 20 }) }
      const parentContent = { avoidCollisions: false, style: `box-sizing: border-box; width: ${anchor.width}px` }
      const sub = (name: typeof SUB_FAMILIES[number]) => () => {
        const { Sub, SubTrigger, SubContent, Portal, Arrow } = subParts[name]
        return h(Sub, { open: true }, () => [
          h(SubTrigger, { 'data-testid': 'anchor', 'style': `display: block; height: ${anchor.height}px` }),
          h(Portal, null, () => h(SubContent, content(), children(Arrow))),
        ])
      }

      const families: Record<Family, () => any> = {
        Popover: () => h(PopoverRoot, { open: true }, () => [
          h(PopoverTrigger, trigger),
          h(PopoverPortal, null, () => h(PopoverContent, content(), children(PopoverArrow))),
        ]),
        DropdownMenu: () => h(DropdownMenuRoot, { open: true, modal: false }, () => [
          h(DropdownMenuTrigger, trigger),
          h(DropdownMenuPortal, null, () => h(DropdownMenuContent, content(), children(DropdownMenuArrow))),
        ]),
        Menubar: () => h(MenubarRoot, { modelValue: 'menu' }, () => h(MenubarMenu, { value: 'menu' }, () => [
          h(MenubarTrigger, trigger),
          h(MenubarPortal, null, () => h(MenubarContent, content(), children(MenubarArrow))),
        ])),
        ContextMenu: () => h(ContextMenuRoot, { modal: false }, () => [
          h(ContextMenuTrigger, { 'data-testid': 'area', 'style': 'position: absolute; inset: 0' }),
          h(ContextMenuPortal, null, () => h(ContextMenuContent, content(), children(ContextMenuArrow))),
        ]),
        DropdownMenuSub: () => h(DropdownMenuRoot, { open: true, modal: false }, () => [
          h(DropdownMenuTrigger, parentTrigger),
          h(DropdownMenuPortal, null, () => h(DropdownMenuContent, { ...parentContent, side: 'bottom', align: 'start' }, sub('DropdownMenuSub'))),
        ]),
        MenubarSub: () => h(MenubarRoot, { modelValue: 'menu' }, () => h(MenubarMenu, { value: 'menu' }, () => [
          h(MenubarTrigger, parentTrigger),
          h(MenubarPortal, null, () => h(MenubarContent, { ...parentContent, side: 'bottom', align: 'start' }, sub('MenubarSub'))),
        ])),
        ContextMenuSub: () => h(ContextMenuRoot, { modal: false }, () => [
          h(ContextMenuTrigger, { 'data-testid': 'area', 'style': 'position: absolute; inset: 0' }),
          h(ContextMenuPortal, null, () => h(ContextMenuContent, parentContent, sub('ContextMenuSub'))),
        ]),
      }

      return () => h('div', { 'ref': boundary, 'data-testid': 'boundary', 'style': boundaryStyle }, [families[family]()])
    },
  }), { attachTo: document.body })

  // A context menu opens to the right of the pointer, 2px away, with its top on the pointer.
  if (family === 'ContextMenu')
    await userEvent.click(get('area')!, { button: 'right', position: { x: anchor.left, y: anchor.top } })
  if (family === 'ContextMenuSub')
    await userEvent.click(get('area')!, { button: 'right', position: { x: anchor.left - 2, y: anchor.top } })

  await waitForPlaced()
  return wrapper
}

/** Where the content ended up: its placement, and its top left corner relative to the boundary. */
function placement() {
  const content = get('content')!
  const rect = content.getBoundingClientRect()
  const boundary = get('boundary')!.getBoundingClientRect()
  return `${content.dataset.side}-${content.dataset.align} ${Math.round(rect.left - boundary.left)},${Math.round(rect.top - boundary.top)}`
}

/**
 * Move the anchor 40px down without scrolling, and without rendering anything again.
 * A sub trigger is offset from its place in the parent content, which is left untouched.
 */
function shiftLayout() {
  const anchor = get('anchor')!
  if (anchor.style.position === 'absolute')
    anchor.style.top = `${Number.parseFloat(anchor.style.top) + 40}px`
  else
    Object.assign(anchor.style, { position: 'relative', top: '40px' })
}

const side = () => get('content')!.dataset.side
const isArrowHidden = () => get('arrow')!.parentElement!.style.visibility === 'hidden'

// The context menu content and the sub contents choose `side` and `align` themselves.
function rootProps(family: Family, props: Record<string, unknown>) {
  return (ROOT_FAMILIES as readonly string[]).includes(family) ? props : {}
}

describe('menu content positioning props', () => {
  describe('sideFlip', () => {
    // The content does not fit on the preferred side, and fits on the opposite one.
    const cases: [Family, Rect, flipped: string][] = [
      ['Popover', { left: 20, top: 270, width: 100, height: 20 }, 'top'],
      ['DropdownMenu', { left: 20, top: 270, width: 100, height: 20 }, 'top'],
      ['Menubar', { left: 20, top: 270, width: 100, height: 20 }, 'top'],
      ['ContextMenu', { left: 250, top: 100, width: 0, height: 0 }, 'left'],
      ['DropdownMenuSub', { left: 170, top: 100, width: 120, height: 20 }, 'left'],
      ['ContextMenuSub', { left: 170, top: 100, width: 120, height: 20 }, 'left'],
      ['MenubarSub', { left: 170, top: 100, width: 120, height: 20 }, 'left'],
    ]

    describe.each(cases)('%s', (family, anchor, flipped) => {
      const preferred = flipped === 'top' ? 'bottom' : 'right'
      const props = rootProps(family, { side: 'bottom' })

      it('flips to the opposite side by default', async () => {
        await mountMenu(family, { anchor, size: [100, 40], props })
        expect(side()).toBe(flipped)
      })

      it('stays on the preferred side with sideFlip disabled', async () => {
        await mountMenu(family, { anchor, size: [100, 40], props: { ...props, sideFlip: false } })
        expect(side()).toBe(preferred)
      })
    })
  })

  describe('alignFlip', () => {
    // The content fits beside the anchor, but overflows the bottom of the boundary
    // along the alignment axis. Aligning its end with the anchor makes it fit.
    const cases: [Family, Rect][] = [
      ['Popover', { left: 20, top: 250, width: 100, height: 20 }],
      ['DropdownMenu', { left: 20, top: 250, width: 100, height: 20 }],
      ['Menubar', { left: 20, top: 250, width: 100, height: 20 }],
      ['ContextMenu', { left: 20, top: 250, width: 0, height: 0 }],
      ['DropdownMenuSub', { left: 20, top: 250, width: 120, height: 20 }],
      ['ContextMenuSub', { left: 20, top: 250, width: 120, height: 20 }],
      ['MenubarSub', { left: 20, top: 250, width: 120, height: 20 }],
    ]
    const align = () => get('content')!.dataset.align

    describe.each(cases)('%s', (family, anchor) => {
      // Sub contents already prioritise their position.
      const props = { ...rootProps(family, { side: 'right', align: 'start' }), prioritizePosition: true }

      it('flips the alignment by default', async () => {
        await mountMenu(family, { anchor, size: [100, 80], props })
        expect(`${side()}-${align()}`).toBe('right-end')
      })

      it('keeps the preferred alignment with alignFlip disabled', async () => {
        await mountMenu(family, { anchor, size: [100, 80], props: { ...props, alignFlip: false } })
        expect(`${side()}-${align()}`).toBe('right-start')
      })
    })
  })

  describe('hideShiftedArrow', () => {
    // The content is shifted along the boundary until the arrow can no longer reach the anchor.
    const cases: [Family, Rect, Record<string, unknown>][] = [
      ['Popover', { left: 0, top: 100, width: 20, height: 20 }, { side: 'bottom', arrowPadding: 20 }],
      ['DropdownMenu', { left: 0, top: 100, width: 20, height: 20 }, { side: 'bottom', arrowPadding: 20 }],
      ['Menubar', { left: 0, top: 100, width: 20, height: 20 }, { side: 'bottom', align: 'center', arrowPadding: 20 }],
      ['ContextMenu', { left: 20, top: 298, width: 0, height: 0 }, {}],
      ['DropdownMenuSub', { left: 20, top: 278, width: 120, height: 20 }, { arrowPadding: 30 }],
      ['ContextMenuSub', { left: 20, top: 278, width: 120, height: 20 }, { arrowPadding: 30 }],
      ['MenubarSub', { left: 20, top: 278, width: 120, height: 20 }, { arrowPadding: 30 }],
    ]

    describe.each(cases)('%s', (family, anchor, props) => {
      const size: [number, number] = props.side === 'bottom' ? [160, 40] : [100, 80]

      it('hides an arrow that cannot point at the anchor by default', async () => {
        await mountMenu(family, { anchor, size, props, arrow: true })
        expect(isArrowHidden()).toBe(true)
      })

      it('keeps the arrow visible with hideShiftedArrow disabled', async () => {
        await mountMenu(family, { anchor, size, props: { ...props, hideShiftedArrow: false }, arrow: true })
        expect(isArrowHidden()).toBe(false)
      })
    })
  })

  // Not applicable to the context menu content, which is anchored to a point rather than an element.
  describe('disableUpdateOnLayoutShift', () => {
    const families = ['Popover', 'DropdownMenu', 'Menubar', 'DropdownMenuSub', 'MenubarSub'] as const

    describe.each(families)('%s', (family) => {
      const anchor = { left: 20, top: 100, width: 120, height: 20 }
      const props = rootProps(family, { side: 'bottom', align: 'start' })
      const top = () => Math.round(get('content')!.getBoundingClientRect().top)
      const anchorTop = () => Math.round(get('anchor')!.getBoundingClientRect().top)

      it('follows the anchor when the layout shifts by default', async () => {
        await mountMenu(family, { anchor, size: [100, 40], props })
        const offset = top() - anchorTop()

        shiftLayout()
        await expect.poll(() => anchorTop(), POLL).toBe(190)
        await expect.poll(() => top() - anchorTop(), POLL).toBe(offset)
      })

      it('stays where it was placed with disableUpdateOnLayoutShift', async () => {
        await mountMenu(family, { anchor, size: [100, 40], props: { ...props, disableUpdateOnLayoutShift: true } })
        const before = top()

        shiftLayout()
        await expect.poll(() => anchorTop(), POLL).toBe(190)
        await new Promise(resolve => setTimeout(resolve, 500))
        expect(top()).toBe(before)
      })
    })
  })

  // Same restriction: the anchor has to move for the content to be positioned again on its own.
  describe('memoDependencies', () => {
    const families = ['Popover', 'DropdownMenu', 'Menubar', 'DropdownMenuSub', 'MenubarSub'] as const

    describe.each(families)('%s', (family) => {
      const anchor = { left: 20, top: 100, width: 120, height: 20 }
      const props = rootProps(family, { side: 'bottom', align: 'start' })
      const top = () => Math.round(get('content')!.getBoundingClientRect().top)

      async function rendersWhileMoving(memoDependencies?: unknown[]) {
        let renders = 0
        await mountMenu(family, { anchor, size: [100, 40], props: { ...props, memoDependencies }, slot: () => {
          renders++
          return 'Content'
        } })
        const before = top()
        renders = 0

        shiftLayout()
        await expect.poll(() => top(), POLL).toBe(before + 40)
        await settle()
        return renders
      }

      it('renders the content again when it is repositioned by default', async () => {
        expect(await rendersWhileMoving()).toBeGreaterThan(0)
      })

      it('skips rendering the content while its memoDependencies are unchanged', async () => {
        expect(await rendersWhileMoving([])).toBe(0)
      })
    })
  })
})

// Placement of content that sets none of the props above, so that forwarding them changes nothing.
describe('menu content default placement', () => {
  const rows: [name: string, Family, Rect, size: [number, number], Record<string, unknown>, expected: string][] = [
    ['fits below', 'DropdownMenu', { left: 100, top: 100, width: 100, height: 20 }, [100, 40], {}, 'bottom-center 100,120'],
    ['fits below, aligned to the end with offsets', 'DropdownMenu', { left: 100, top: 100, width: 100, height: 20 }, [60, 40], { align: 'end', sideOffset: 4, alignOffset: 6 }, 'bottom-end 134,124'],
    ['flips above', 'DropdownMenu', { left: 100, top: 270, width: 100, height: 20 }, [100, 40], {}, 'top-center 100,230'],
    ['flips to the left', 'DropdownMenu', { left: 180, top: 100, width: 100, height: 20 }, [100, 40], { side: 'right' }, 'left-center 80,90'],
    ['shifts along the left edge', 'DropdownMenu', { left: 0, top: 100, width: 40, height: 20 }, [160, 40], {}, 'bottom-center 0,120'],
    ['shifts along the right edge with collision padding', 'DropdownMenu', { left: 260, top: 100, width: 40, height: 20 }, [160, 40], { collisionPadding: 10 }, 'bottom-center 130,120'],
    ['stays on the axis when neither side fits', 'DropdownMenu', { left: 0, top: 100, width: 300, height: 20 }, [160, 40], { side: 'right' }, 'right-center 300,90'],
    ['overflows with collisions not avoided', 'DropdownMenu', { left: 100, top: 270, width: 100, height: 20 }, [100, 40], { avoidCollisions: false }, 'bottom-center 100,290'],
    ['fits below', 'Menubar', { left: 100, top: 100, width: 100, height: 20 }, [100, 40], {}, 'bottom-start 100,120'],
    ['flips above', 'Menubar', { left: 100, top: 270, width: 100, height: 20 }, [100, 40], {}, 'top-start 100,230'],
    ['shifts along the right edge', 'Menubar', { left: 260, top: 100, width: 40, height: 20 }, [160, 40], {}, 'bottom-start 140,120'],
    ['fits to the right of the pointer', 'ContextMenu', { left: 100, top: 100, width: 0, height: 0 }, [100, 40], {}, 'right-start 102,100'],
    ['flips to the left of the pointer', 'ContextMenu', { left: 250, top: 100, width: 0, height: 0 }, [100, 40], {}, 'left-start 148,100'],
    ['shifts up from the bottom edge', 'ContextMenu', { left: 100, top: 280, width: 0, height: 0 }, [100, 80], {}, 'right-start 102,220'],
    ['fits to the right', 'DropdownMenuSub', { left: 20, top: 100, width: 120, height: 20 }, [100, 40], {}, 'right-start 140,100'],
    ['flips to the left', 'DropdownMenuSub', { left: 170, top: 100, width: 120, height: 20 }, [100, 40], {}, 'left-start 70,100'],
    ['flips the alignment at the bottom edge', 'DropdownMenuSub', { left: 20, top: 270, width: 120, height: 20 }, [100, 80], {}, 'right-end 140,210'],
    ['overlaps the parent when neither side fits', 'DropdownMenuSub', { left: 90, top: 100, width: 120, height: 20 }, [100, 40], {}, 'right-start 200,100'],
    ['flips to the left', 'ContextMenuSub', { left: 170, top: 100, width: 120, height: 20 }, [100, 40], {}, 'left-start 70,100'],
    ['flips the alignment at the bottom edge', 'MenubarSub', { left: 20, top: 270, width: 120, height: 20 }, [100, 80], {}, 'right-end 140,210'],
  ]

  it.each(rows)('%s (%s)', async (_name, family, anchor, size, props, expected) => {
    await mountMenu(family, { anchor, size, props })
    expect(placement()).toBe(expected)
  })
})
