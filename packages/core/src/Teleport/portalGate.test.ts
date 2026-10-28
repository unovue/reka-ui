import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref, watch } from 'vue'
import { AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from '@/AlertDialog'
import { CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot } from '@/Combobox'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DrawerContent, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTitle } from '@/Drawer'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { Presence } from '@/Presence'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const components = {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  CheckboxIndicator,
  CheckboxRoot,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarTrigger,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  Presence,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
}

/** One closed popup per family, opened through the `open` ref. */
const families: Record<string, string> = {
  Popover: `<PopoverRoot v-model:open="open"><PopoverTrigger>t</PopoverTrigger>
    <PopoverPortal><PopoverContent data-testid="content">c</PopoverContent></PopoverPortal></PopoverRoot>`,
  Dialog: `<DialogRoot v-model:open="open"><DialogTrigger>t</DialogTrigger>
    <DialogPortal><DialogOverlay /><DialogContent data-testid="content"><DialogTitle>t</DialogTitle><DialogDescription>d</DialogDescription></DialogContent></DialogPortal></DialogRoot>`,
  AlertDialog: `<AlertDialogRoot v-model:open="open">
    <AlertDialogPortal><AlertDialogOverlay /><AlertDialogContent data-testid="content"><AlertDialogTitle>t</AlertDialogTitle><AlertDialogDescription>d</AlertDialogDescription></AlertDialogContent></AlertDialogPortal></AlertDialogRoot>`,
  DropdownMenu: `<DropdownMenuRoot v-model:open="open"><DropdownMenuTrigger>t</DropdownMenuTrigger>
    <DropdownMenuPortal><DropdownMenuContent data-testid="content"><DropdownMenuItem>i</DropdownMenuItem></DropdownMenuContent></DropdownMenuPortal></DropdownMenuRoot>`,
  ContextMenu: `<ContextMenuRoot><ContextMenuTrigger>t</ContextMenuTrigger>
    <ContextMenuPortal><ContextMenuContent data-testid="content"><ContextMenuItem>i</ContextMenuItem></ContextMenuContent></ContextMenuPortal></ContextMenuRoot>`,
  Menubar: `<MenubarRoot><MenubarMenu><MenubarTrigger>t</MenubarTrigger>
    <MenubarPortal><MenubarContent data-testid="content"><MenubarItem>i</MenubarItem></MenubarContent></MenubarPortal></MenubarMenu></MenubarRoot>`,
  HoverCard: `<HoverCardRoot v-model:open="open"><HoverCardTrigger>t</HoverCardTrigger>
    <HoverCardPortal><HoverCardContent data-testid="content">c</HoverCardContent></HoverCardPortal></HoverCardRoot>`,
  Tooltip: `<TooltipProvider><TooltipRoot v-model:open="open"><TooltipTrigger>t</TooltipTrigger>
    <TooltipPortal><TooltipContent data-testid="content">c</TooltipContent></TooltipPortal></TooltipRoot></TooltipProvider>`,
  Drawer: `<DrawerRoot v-model:open="open">
    <DrawerPortal><DrawerOverlay /><DrawerContent data-testid="content"><DrawerTitle>t</DrawerTitle></DrawerContent></DrawerPortal></DrawerRoot>`,
  Combobox: `<ComboboxRoot v-model:open="open"><ComboboxAnchor><ComboboxInput /></ComboboxAnchor>
    <ComboboxPortal><ComboboxContent data-testid="content"><ComboboxItem value="a">a</ComboboxItem></ComboboxContent></ComboboxPortal></ComboboxRoot>`,
}

const openable = ['Popover', 'Dialog', 'AlertDialog', 'DropdownMenu', 'HoverCard', 'Tooltip', 'Drawer', 'Combobox']

function mountTemplate(template: string, open = ref(false)) {
  const wrapper = mount(defineComponent({
    components,
    setup: () => ({ open }),
    template: `<div>${template}</div>`,
  }), { attachTo: document.body })
  return { wrapper, open }
}

describe('a closed popup renders no portal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it.each(Object.keys(families))('%s: nothing is teleported and no content part or Presence is set up', async (family) => {
    const before = document.body.childNodes.length
    const { wrapper } = mountTemplate(families[family])
    await nextTick()
    // Only the test's own mount container was added: no Teleport anchors.
    expect(document.body.childNodes.length).toBe(before + 1)
    expect(wrapper.findComponent(Presence).exists()).toBe(false)
    expect(document.querySelector('[data-testid="content"]')).toBeNull()
    wrapper.unmount()
  })

  it.each(openable)('%s: opens, closes and reopens', async (family) => {
    const { wrapper, open } = mountTemplate(families[family])
    await nextTick()
    open.value = true
    await nextTick()
    await nextTick()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()

    open.value = false
    await vi.waitFor(() => expect(document.querySelector('[data-testid="content"]')).toBeNull())

    open.value = true
    await nextTick()
    await nextTick()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('renders right away when the content is force-mounted', async () => {
    mountTemplate(`<PopoverRoot><PopoverPortal><PopoverContent force-mount data-testid="content">c</PopoverContent></PopoverPortal></PopoverRoot>`)
    await nextTick()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('renders right away when the portal is force-mounted', async () => {
    const { wrapper } = mountTemplate(`<DialogRoot><DialogPortal force-mount><DialogContent data-testid="content" /></DialogPortal></DialogRoot>`)
    await nextTick()
    // The portal renders; the closed content itself does not.
    expect(wrapper.findComponent(DialogContent).exists()).toBe(true)
    expect(document.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('renders right away when the dialog keeps its content mounted (`unmountOnHide: false`)', async () => {
    mountTemplate(`<DialogRoot :unmount-on-hide="false"><DialogPortal><DialogContent data-testid="content"><DialogTitle>t</DialogTitle></DialogContent></DialogPortal></DialogRoot>`)
    await nextTick()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('renders right away when the portal holds anything other than its content parts', async () => {
    mountTemplate(`<DialogRoot><DialogPortal><div data-testid="extra">x</div><DialogContent /></DialogPortal></DialogRoot>`)
    await nextTick()
    expect(document.querySelector('[data-testid="extra"]')).not.toBeNull()
  })

  it('renders right away around a Vue `<Transition>`, so it sees its child mount while closed', async () => {
    const { wrapper } = mountTemplate(`<DialogRoot><DialogPortal><Transition name="fade"><DialogContent /></Transition></DialogPortal></DialogRoot>`)
    await nextTick()
    expect(wrapper.findComponent(DialogContent).exists()).toBe(true)
  })

  it('does not gate a portal outside its Root', async () => {
    mountTemplate(`<PopoverPortal><div data-testid="extra">x</div></PopoverPortal>`)
    await nextTick()
    expect(document.querySelector('[data-testid="extra"]')).not.toBeNull()
  })

  it('stays rendered after the first open', async () => {
    const { wrapper, open } = mountTemplate(families.Popover)
    open.value = true
    await nextTick()
    open.value = false
    await vi.waitFor(() => expect(document.querySelector('[data-testid="content"]')).toBeNull())
    expect(wrapper.findComponent(PopoverContent).exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('the first open through a gated portal', () => {
  // jsdom has no `getAnimations`; stub it so the presence lifecycle runs.
  let running: Animation[] = []
  beforeEach(() => {
    running = []
    Element.prototype.getAnimations = function (this: Element) {
      return running.filter(animation => animation.playState === 'running' && (animation as any).target === this)
    }
  })
  afterEach(() => {
    // @ts-expect-error restoring jsdom's missing implementation
    delete Element.prototype.getAnimations
    document.body.innerHTML = ''
  })

  it('renders `data-starting-style` on the content and overlay, like later opens', async () => {
    const { wrapper, open } = mountTemplate(families.Dialog)
    await nextTick()
    open.value = true
    await nextTick()
    await nextTick()
    const content = document.querySelector('[data-testid="content"]')!
    expect(content.hasAttribute('data-starting-style')).toBe(true)
    expect(document.querySelector('[data-dismissable-layer], [role="dialog"]')).not.toBeNull()
    await vi.waitFor(() => expect(content.hasAttribute('data-starting-style')).toBe(false))

    open.value = false
    await vi.waitFor(() => expect(document.querySelector('[data-testid="content"]')).toBeNull())
    open.value = true
    await nextTick()
    expect(document.querySelector('[data-testid="content"]')!.hasAttribute('data-starting-style')).toBe(true)
    wrapper.unmount()
  })

  it('does not stamp `data-starting-style` on a popup that starts open', async () => {
    const { wrapper } = mountTemplate(families.Popover, ref(true))
    await nextTick()
    await nextTick()
    expect(document.querySelector('[data-testid="content"]')!.hasAttribute('data-starting-style')).toBe(false)
    wrapper.unmount()
  })

  it('does not stamp it on presences nested in the content', async () => {
    const { wrapper, open } = mountTemplate(`<PopoverRoot v-model:open="open">
      <PopoverPortal><PopoverContent data-testid="content"><CheckboxRoot :model-value="true"><CheckboxIndicator data-testid="indicator" /></CheckboxRoot></PopoverContent></PopoverPortal></PopoverRoot>`)
    await nextTick()
    open.value = true
    await nextTick()
    await nextTick()
    expect(document.querySelector('[data-testid="content"]')!.hasAttribute('data-starting-style')).toBe(true)
    const indicator = document.querySelector('[data-testid="indicator"]')!
    expect(indicator.hasAttribute('data-starting-style')).toBe(false)
    wrapper.unmount()
  })
})

describe('what the first open through a gated portal shows to the rest of the app', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // `watch(open, …, { flush: 'post' })` is Vue's documented way to reach the DOM
  // after an update: the content must be there on the first open too.
  it.each(openable)('%s: a post-flush watcher on `open` sees the content on every open', async (family) => {
    const open = ref(false)
    const seen: Array<boolean> = []
    const wrapper = mount(defineComponent({
      components,
      setup() {
        watch(open, (value) => {
          if (value)
            seen.push(!!document.querySelector('[data-testid="content"]'))
        }, { flush: 'post' })
        return { open }
      },
      template: `<div>${families[family]}</div>`,
    }), { attachTo: document.body })
    await nextTick()
    open.value = true
    await nextTick()
    open.value = false
    await vi.waitFor(() => expect(document.querySelector('[data-testid="content"]')).toBeNull())
    open.value = true
    await nextTick()
    expect(seen).toEqual([true, true])
    wrapper.unmount()
  })

  it.each([
    ['Dialog', `<DialogRoot v-model:open="open"><DialogTrigger data-testid="trigger">t</DialogTrigger>
      <DialogPortal><DialogContent id="custom"><DialogTitle>t</DialogTitle><DialogDescription>d</DialogDescription></DialogContent></DialogPortal></DialogRoot>`],
    ['Popover', `<PopoverRoot v-model:open="open"><PopoverTrigger data-testid="trigger">t</PopoverTrigger>
      <PopoverPortal><PopoverContent id="custom">c</PopoverContent></PopoverPortal></PopoverRoot>`],
  ])('%s: the trigger\'s `aria-controls` names a custom content id on the first open', async (_, template) => {
    const { wrapper, open } = mountTemplate(template)
    await nextTick()
    open.value = true
    await nextTick()
    await nextTick()
    expect(document.getElementById('custom')).not.toBeNull()
    expect(document.querySelector('[data-testid="trigger"]')!.getAttribute('aria-controls')).toBe('custom')
    wrapper.unmount()
  })

  // The submenu's content id is allocated by `MenuSub`, not by its (gated) content.
  describe('a submenu trigger\'s `aria-controls` on the first open', () => {
    const template = `<DropdownMenuRoot default-open><DropdownMenuTrigger>t</DropdownMenuTrigger>
      <DropdownMenuPortal><DropdownMenuContent><DropdownMenuItem>i</DropdownMenuItem>
        <DropdownMenuSub v-model:open="open"><DropdownMenuSubTrigger data-testid="sub-trigger">More</DropdownMenuSubTrigger>
          <DropdownMenuPortal><DropdownMenuSubContent data-testid="sub-content"><DropdownMenuItem>s</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal>
        </DropdownMenuSub></DropdownMenuContent></DropdownMenuPortal></DropdownMenuRoot>`

    async function expectControlsContent() {
      const subContent = await vi.waitFor(() => {
        const element = document.querySelector('[data-testid="sub-content"]')
        expect(element).not.toBeNull()
        return element!
      })
      const subTrigger = document.querySelector('[data-testid="sub-trigger"]')!
      expect(subTrigger.getAttribute('aria-expanded')).toBe('true')
      expect(subContent.id).toBeTruthy()
      expect(subTrigger.getAttribute('aria-controls')).toBe(subContent.id)
    }

    it('when opened programmatically', async () => {
      const { wrapper, open } = mountTemplate(template)
      await nextTick()
      open.value = true
      await nextTick()
      await nextTick()
      await expectControlsContent()
      wrapper.unmount()
    })

    it('when opened from the keyboard', async () => {
      const { wrapper } = mountTemplate(template)
      await nextTick()
      const subTrigger = document.querySelector('[data-testid="sub-trigger"]') as HTMLElement
      subTrigger.focus()
      subTrigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await expectControlsContent()
      wrapper.unmount()
    })

    it('when opened on hover', async () => {
      const { wrapper } = mountTemplate(template)
      await nextTick()
      const subTrigger = document.querySelector('[data-testid="sub-trigger"]') as HTMLElement
      subTrigger.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
      await expectControlsContent()
      wrapper.unmount()
    })
  })
})
