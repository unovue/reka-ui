import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from '.'

function mountMenu({ scale = '1', align = 'center', vertical = false, panelSize = 120, outerStyle = '', rootSize = 300, rootStyle = '' }: {
  scale?: string
  align?: 'start' | 'center' | 'end'
  vertical?: boolean
  outerStyle?: string
  rootSize?: number
  rootStyle?: string
  panelSize?: number
} = {}) {
  mount(defineComponent({
    setup: () => () => h('div', { 'data-testid': 'outer', 'style': `position: fixed; left: 200px; top: 150px; ${outerStyle}` }, [
      h('div', { 'data-testid': 'boundary', 'style': `width: 300px; height: 300px; transform: scale(${scale}); transform-origin: top left;` }, [
        h(NavigationMenuRoot, { 'data-testid': 'root', 'orientation': vertical ? 'vertical' : 'horizontal', 'disableHoverTrigger': true, 'style': `position: relative; width: ${rootSize}px; height: ${rootSize}px; ${rootStyle}` }, () => [
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
  const cases = ['0.6', '0.998', '1', '1.002', '1.5', '0.6, 1.5'].flatMap(scale =>
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

  const fractionalClamps = [300.25, 300.5].flatMap(rootSize =>
    ['0.6', '0.998', '1', '1.002', '1.5', '0.998, 1.002'].flatMap(scale =>
      [false, true].flatMap(vertical => ['leading', 'trailing'].map(edge => ({ rootSize, scale, vertical, edge }))),
    ),
  )

  it.each(fractionalClamps)('clamps fractional $rootSize root at $edge edge under scale($scale), vertical=$vertical', async ({ rootSize, scale, vertical, edge }) => {
    const coordinate = vertical ? 'top' : 'left'
    const documentSize = vertical ? document.documentElement.offsetHeight : document.documentElement.offsetWidth
    const actualScale = Number(scale.split(',')[vertical ? 1 : 0] ?? scale)
    // A large displacement makes offset rounding (and a 1px scale snap) observable.
    // Oversized content must retain the existing leading-edge precedence.
    const panelSize = edge === 'leading' ? documentSize * 2 / actualScale : 260
    const rootPosition = edge === 'leading' ? 420 : documentSize - 100.4 * actualScale
    const { get, open } = mountMenu({ rootSize, scale, vertical, panelSize, outerStyle: `${coordinate}: ${rootPosition}px;` })
    await open('one')
    await expect.poll(() => {
      const rootRect = get('root').getBoundingClientRect()
      const viewport = get('viewport')
      const contentSize = vertical ? viewport.offsetHeight : viewport.offsetWidth
      const minimum = (10 - rootRect[coordinate]) / actualScale
      const maximum = (documentSize - 10 - rootRect[coordinate]) / actualScale - contentSize
      const expected = Math.round(edge === 'leading' ? minimum : Math.max(minimum, maximum))
      const actual = Number.parseFloat(viewport.style.getPropertyValue(`--reka-navigation-menu-viewport-${coordinate}`))
      // Compare the local CSS position, including intentional final rounding,
      // instead of hiding a whole-pixel error behind a loose visual tolerance.
      return actual - expected
    }).toBe(0)
  })

  it.each(['content-box', 'border-box'])('measures the fractional %s border box after a resize', async (boxSizing) => {
    const { get, open } = mountMenu({
      rootSize: 300.5,
      scale: '1.002',
      panelSize: document.documentElement.offsetWidth * 2,
      outerStyle: 'left: 420px;',
      rootStyle: `box-sizing: ${boxSizing}; padding: 7.25px; border: 1px solid transparent;`,
    })
    await open('one')
    const assertPosition = () => expect.poll(() => {
      const rootRect = get('root').getBoundingClientRect()
      const expected = Math.round((10 - rootRect.left) / 1.002)
      return Number.parseFloat(get('viewport').style.getPropertyValue('--reka-navigation-menu-viewport-left')) - expected
    }).toBe(0)
    await assertPosition()
    get('root').style.width = '310.75px'
    get('root').style.padding = '12.5px'
    // Move the root too so the assertion cannot pass with the previous position.
    get('outer').style.left = '430px'
    await assertPosition()
  })

  it.each(['vertical-rl', 'sideways-lr'])('uses physical border-box axes for %s writing mode', async (writingMode) => {
    const { get, open } = mountMenu({
      rootSize: 300.5,
      scale: '0.998, 1.002',
      panelSize: Math.max(document.documentElement.offsetWidth, document.documentElement.offsetHeight) * 2,
      outerStyle: 'left: 420px; top: 420px;',
      rootStyle: `height: 240.25px; writing-mode: ${writingMode};`,
    })
    await open('one')
    await expect.poll(() => {
      const rect = get('root').getBoundingClientRect()
      return [
        get('viewport').style.getPropertyValue('--reka-navigation-menu-viewport-left'),
        get('viewport').style.getPropertyValue('--reka-navigation-menu-viewport-top'),
      ].join(',') === [
        `${Math.round((10 - rect.left) / 0.998)}px`,
        `${Math.round((10 - rect.top) / 1.002)}px`,
      ].join(',')
    }).toBe(true)
  })
})
