import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '.'

function mountMenu(modal: boolean) {
  const Fixture = defineComponent({
    setup() {
      return () => h(DropdownMenuRoot, { modal }, () => [
        h(DropdownMenuTrigger, { 'data-testid': 'trigger', 'style': 'padding: 20px; width: 100px; height: 40px;' }, () => [
          h('span', { 'data-testid': 'icon-host' }),
        ]),
        h(DropdownMenuPortal, null, () => h(DropdownMenuContent, {
          'data-testid': 'content',
          'style': 'width: 160px; background: white;',
        }, () => [
          h(DropdownMenuItem, { style: 'display: block; height: 24px; padding: 0 8px;' }, () => 'New'),
        ])),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  onTestFinished(() => wrapper.unmount())

  const trigger = document.querySelector<HTMLElement>('[data-testid="trigger"]')!
  const host = document.querySelector<HTMLElement>('[data-testid="icon-host"]')!
  const shadow = host.attachShadow({ mode: 'open' })
  const icon = document.createElement('span')
  icon.style.cssText = 'display:inline-block;width:20px;height:20px'
  shadow.appendChild(icon)
  const content = () => document.querySelector('[data-testid="content"]')
  return { trigger, icon, content }
}

describe.each([false, true])('given a DropdownMenu (modal: %s) whose trigger contains a shadow-DOM child', (modal) => {
  it('closes when the press lands inside a shadow child of the trigger', async () => {
    const { trigger, icon, content } = mountMenu(modal)

    await userEvent.click(trigger, { position: { x: 2, y: 2 } })
    await expect.poll(content).not.toBeNull()

    await userEvent.click(icon)
    await expect.poll(content).toBeNull()
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(content()).toBeNull()
  })

  it('opens from a press inside the shadow child', async () => {
    const { icon, content } = mountMenu(modal)

    await userEvent.click(icon)
    await expect.poll(content).not.toBeNull()
  })
})
