// @vitest-environment node
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '.'

// Runs without jsdom: on a real server there is no `document` or `window`.
describe('given an open NavigationMenu rendered on the server', () => {
  it('has no DOM globals', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('renders the open item with its trigger ids', async () => {
    const html = await renderToString(createSSRApp({
      render: () => h(NavigationMenuRoot, { defaultValue: 'one' }, () => [
        h(NavigationMenuList, () => [
          h(NavigationMenuItem, { value: 'one' }, () => [
            h(NavigationMenuTrigger, () => 'One'),
            h(NavigationMenuContent, () => h(NavigationMenuLink, { href: '#a' }, () => 'Link A')),
          ]),
          h(NavigationMenuIndicator),
        ]),
        h(NavigationMenuViewport),
      ]),
    }))

    expect(html).toMatch(/id="[^"]*-trigger-one"/)
    expect(html).toMatch(/aria-controls="[^"]*-content-one"/)
    expect(html).toContain('aria-expanded="true"')
  })
})
