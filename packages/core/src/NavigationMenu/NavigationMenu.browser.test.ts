import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '.'

describe('given an open NavigationMenu, in a real browser', () => {
  // A native radio group is one tab stop, so Tab leaves it for the next element.
  it.each([
    { checked: null, from: 'a' },
    { checked: 'b', from: 'b' },
  ])('tabs out of a radio group in the content (checked: $checked)', async ({ checked, from }) => {
    const Fixture = defineComponent({
      setup() {
        return () => h(NavigationMenuRoot, { modelValue: 'one' }, () => h(NavigationMenuList, () => [
          h(NavigationMenuItem, { value: 'one' }, () => [
            h(NavigationMenuTrigger, () => 'One'),
            h(NavigationMenuContent, () => [
              ...['a', 'b', 'c'].map(value => h('input', {
                'type': 'radio',
                'name': 'size',
                value,
                'checked': value === checked,
                'aria-label': value,
                'data-testid': value,
              })),
              h(NavigationMenuLink, { 'href': '#link', 'data-testid': 'link' }, () => 'Link'),
            ]),
          ]),
        ]))
      },
    })
    mount(Fixture, { attachTo: document.body })
    await expect.poll(() => document.querySelector('[data-testid="link"]')).toBeTruthy()

    document.querySelector<HTMLElement>(`[data-testid="${from}"]`)!.focus()
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(document.querySelector('[data-testid="link"]'))
  })
})
