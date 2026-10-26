import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from '.'

function mountMenu({ scale = '1', align = 'center', vertical = false, panelSize = 120, outerStyle = '', rootSize = 300 }: {
  scale?: string
  align?: 'start' | 'center' | 'end'
  vertical?: boolean
  outerStyle?: string
  rootSize?: number
  panelSize?: number
} = {}) {
  mount(defineComponent({
    setup: () => () => h('div', { 'data-testid': 'outer', 'style': `position: fixed; left: 200px; top: 150px; ${outerStyle}` }, [
      h('div', { 'data-testid': 'boundary', 'style': `width: 300px; height: 300px; transform: scale(${scale}); transform-origin: top left;` }, [
        h(NavigationMenuRoot, { orientation: vertical ? 'vertical' : 'horizontal', disableHoverTrigger: true, style: `position: relative; width: ${rootSize}px; height: ${rootSize}px;` }, () => [
          h(NavigationMenuList, { style: `display: flex; flex-direction: ${vertical ? 'column' : 'row'}; margin: 0; padding: 0; list-style: none;` }, () => ['one', 'two', 'three'].map(value => h(NavigationMenuItem, { value }, () => [
            h(NavigationMenuTrigger, { 'data-testid': value, 'style': 'box-sizing: border-box; width: 100px; height: 100px;' }, () => value),
            h(NavigationMenuContent, { style: `width: ${panelSize}px; height: ${panelSize}px;` }, () => value),
          ]))),
          h(NavigationMenuViewport, { 'align': align, 'data-testid': 'viewport', 'style': `position: absolute; left: ${vertical ? '0' : 'var(--reka-navigation-menu-viewport-left)'}; top: ${vertical ? 'var(--reka-navigation-menu-viewport-top)' : '0'}; width: var(--reka-navigation-menu-viewport-width); height: var(--reka-navigation-menu-viewport-height);` }),
        ]),
      ]),
    ]),
  }), { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const open = async (id: string) => {
    await userEvent.click(get(id))
    await expect.poll(() => get('viewport')?.style.getPropertyValue('--reka-navigation-menu-viewport-left')).not.toBeFalsy()
  }
  return { get, open }
}

describe('navigationMenuViewport positioning in a real browser', () => {
  let bodyHeight: string
  beforeEach(() => {
    bodyHeight = document.body.style.height
    document.body.style.height = `${window.innerHeight}px`
  })
  afterEach(() => {
    document.body.style.height = bodyHeight
  })

  const alignments = ['start', 'center', 'end'] as const
  const cases = ['0.6', '1', '1.5', '0.6, 1.5'].flatMap(scale =>
    [false, true].flatMap(vertical => alignments.map(align => ({ scale, vertical, align }))),
  )

  it.each(cases)('aligns $align under scale($scale), vertical=$vertical', async ({ scale, vertical, align }) => {
    const { get, open } = mountMenu({ scale, align, vertical })
    await open('two')
    await expect.poll(() => {
      const trigger = get('two').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const fraction = align === 'start' ? 0 : align === 'end' ? 1 : 0.5
      return Math.abs(vertical
        ? viewport.top + viewport.height * fraction - trigger.top - trigger.height * fraction
        : viewport.left + viewport.width * fraction - trigger.left - trigger.width * fraction)
    }).toBeLessThan(1.6)
  })

  it.each(['0.6', '1', '1.5'])('clamps the leading screen edge under scale(%s)', async (scale) => {
    const { get, open } = mountMenu({ scale, outerStyle: 'left: 0;', panelSize: 260 })
    await open('one')
    await expect.poll(() => Math.abs(get('viewport').getBoundingClientRect().left - 10)).toBeLessThan(1)
  })

  it.each(['0.6', '1', '1.5'])('clamps the trailing screen edge under scale(%s)', async (scale) => {
    const { get, open } = mountMenu({ scale, outerStyle: `left: calc(100vw - ${100 * Number(scale)}px);`, panelSize: 260 })
    await open('one')
    await expect.poll(() => Math.abs(get('viewport').getBoundingClientRect().right - (document.documentElement.offsetWidth - 10))).toBeLessThan(1)
  })

  it.each(['0.6', '1', '1.5'])('clamps the top screen edge under scale(%s)', async (scale) => {
    const { get, open } = mountMenu({ scale, vertical: true, outerStyle: 'top: 0;', panelSize: 260 })
    await open('one')
    await expect.poll(() => Math.abs(get('viewport').getBoundingClientRect().top - 10)).toBeLessThan(1)
  })

  it.each(['0.6', '1', '1.5'])('clamps the bottom document edge under scale(%s)', async (scale) => {
    const { get, open } = mountMenu({ scale, vertical: true, outerStyle: `top: ${document.documentElement.offsetHeight - 100 * Number(scale)}px;`, panelSize: 260 })
    await open('one')
    await expect.poll(() => Math.abs(get('viewport').getBoundingClientRect().bottom - (document.documentElement.offsetHeight - 10))).toBeLessThan(1)
  })

  it.each([false, true])('preserves alignment with fractional unscaled root dimensions, vertical=%s', async (vertical) => {
    const { get, open } = mountMenu({ rootSize: 300.5, vertical })
    await open('two')
    await expect.poll(() => {
      const trigger = get('two').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(vertical
        ? viewport.top + viewport.height / 2 - trigger.top - trigger.height / 2
        : viewport.left + viewport.width / 2 - trigger.left - trigger.width / 2)
    }).toBeLessThan(1)
  })
})
