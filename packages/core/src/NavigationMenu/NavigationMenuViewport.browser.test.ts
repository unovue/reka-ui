import { mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from '.'

function mountMenu({ scale = '1', align = 'center', vertical = false, panelSize = 120, outerPosition = 'fixed', outerStyle = '', rootSize = 300, rootStyle = '', boundaryTransform = `scale(${scale})`, avoidClipping = false }: {
  scale?: string
  avoidClipping?: boolean
  align?: 'start' | 'center' | 'end'
  vertical?: boolean
  outerStyle?: string
  outerPosition?: string
  rootSize?: number
  rootStyle?: string
  boundaryTransform?: string
  panelSize?: number
} = {}) {
  mount(defineComponent({
    setup: () => () => h('div', { 'data-testid': 'outer', 'style': `position: ${outerPosition}; left: 200px; top: 150px; ${outerStyle}` }, [
      h('div', { 'data-testid': 'boundary', 'style': `width: 300px; height: 300px; transform: ${boundaryTransform}; transform-origin: top left;` }, [
        h(NavigationMenuRoot, { 'data-testid': 'root', 'orientation': vertical ? 'vertical' : 'horizontal', 'disableHoverTrigger': true, 'style': `position: relative; width: ${rootSize}px; height: ${rootSize}px; ${rootStyle}` }, () => [
          h(NavigationMenuList, { style: `display: flex; flex-direction: ${vertical ? 'column' : 'row'}; margin: 0; padding: 0; list-style: none;` }, () => ['one', 'two', 'three'].map(value => h(NavigationMenuItem, { value }, () => [
            h(NavigationMenuTrigger, { 'data-testid': value, 'style': 'box-sizing: border-box; width: 100px; height: 100px;' }, () => value),
            h(NavigationMenuContent, { style: `width: ${panelSize}px; height: ${panelSize}px;` }, () => value),
          ]))),
          h(NavigationMenuViewport, { 'align': align, avoidClipping, 'data-testid': 'viewport', 'style': `position: absolute; left: ${vertical ? '0' : 'var(--reka-navigation-menu-viewport-left)'}; top: ${vertical ? 'var(--reka-navigation-menu-viewport-top)' : '0'}; width: var(--reka-navigation-menu-viewport-width); height: var(--reka-navigation-menu-viewport-height);` }),
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

function mountClippedMenu({ avoidClipping = true, scale = '1', align = 'center', vertical = false, panelSize = 300, outerWidth = 360, outerHeight = 360, outerOverflow = 'hidden', outerStyle = '', rootSize = 300, triggerSize = 100, boundaryStyle = '', rootStyle = '', viewportWrapperStyle = '' }: {
  scale?: string
  align?: 'start' | 'center' | 'end'
  vertical?: boolean
  panelSize?: number
  outerWidth?: number
  outerHeight?: number
  outerOverflow?: string
  outerStyle?: string
  rootSize?: number
  triggerSize?: number
  boundaryStyle?: string
  rootStyle?: string
  viewportWrapperStyle?: string
  avoidClipping?: boolean
} = {}) {
  mount(defineComponent({
    setup: () => () => {
      const viewport = h(NavigationMenuViewport, { 'align': align, avoidClipping, 'data-testid': 'viewport', 'style': `position: absolute; left: ${vertical ? '0' : 'var(--reka-navigation-menu-viewport-left)'}; top: ${vertical ? 'var(--reka-navigation-menu-viewport-top)' : '0'}; width: var(--reka-navigation-menu-viewport-width); height: var(--reka-navigation-menu-viewport-height);` })
      return h('div', { 'data-testid': 'outer', 'style': `position: fixed; left: 320px; top: 100px; width: ${outerWidth}px; height: ${outerHeight}px; overflow: ${outerOverflow}; ${outerStyle}` }, [
        h('div', { 'data-testid': 'boundary', 'style': `position: relative; width: ${rootSize}px; height: ${rootSize}px; transform: scale(${scale}); transform-origin: top left; ${boundaryStyle}` }, [
          h(NavigationMenuRoot, { 'data-testid': 'root', 'orientation': vertical ? 'vertical' : 'horizontal', 'disableHoverTrigger': true, 'style': `position: relative; width: ${rootSize}px; height: ${rootSize}px; ${rootStyle}` }, () => [
            h(NavigationMenuList, { style: `display: flex; flex-direction: ${vertical ? 'column' : 'row'}; margin: 0; padding: 0; list-style: none;` }, () => ['one', 'two', 'three'].map(value => h(NavigationMenuItem, { value }, () => [
              h(NavigationMenuTrigger, { 'data-testid': value, 'style': `box-sizing: border-box; width: ${vertical ? '100%' : `${triggerSize}px`}; height: ${vertical ? `${triggerSize}px` : '100%'};` }, () => value),
              h(NavigationMenuContent, { 'data-testid': `${value}-content`, 'style': `width: ${panelSize}px; height: ${panelSize}px; pointer-events: auto;` }, () => value),
            ]))),
            viewportWrapperStyle
              ? h('div', { 'data-testid': 'viewport-wrapper', 'style': `position: absolute; left: 0; top: 0; pointer-events: none; ${viewportWrapperStyle}` }, [viewport])
              : viewport,
          ]),
        ]),
      ])
    },
  }), { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const open = async (id: string) => {
    await userEvent.click(get(id))
    await expect.poll(() => get('viewport')?.style.getPropertyValue('--reka-navigation-menu-viewport-left')).not.toBeFalsy()
  }
  return { get, open }
}

describe('navigationMenuViewport positioning in a real browser', () => {
  // The fixtures place menus up to 430px from the left edge and scale them up to 1.5x, so
  // they need more room than the default test frame. Restore it for the files that follow.
  let frameSize: [number, number]
  beforeAll(async () => {
    frameSize = [window.innerWidth, window.innerHeight]
    await page.viewport(1180, 757)
  })
  let bodyHeight: string
  beforeEach(() => {
    bodyHeight = document.body.style.height
    document.body.style.height = `${window.innerHeight}px`
  })
  afterEach(() => {
    document.body.style.height = bodyHeight
  })
  afterAll(async () => {
    await page.viewport(...frameSize)
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

  // Such a root has no size to derive a scale from; the position must still be set.
  const sizelessRoots = ['display: contents;', 'width: 0;', 'height: 0;'].flatMap(rootStyle =>
    [false, true].map(vertical => ({ rootStyle, vertical })),
  )

  it.each(sizelessRoots)('positions the viewport for a root with "$rootStyle", vertical=$vertical', async ({ rootStyle, vertical }) => {
    const { get, open } = mountMenu({ rootStyle, vertical })
    await open('two')
    await expect.poll(() => {
      const rootRect = get('root').getBoundingClientRect()
      const trigger = get('two').getBoundingClientRect()
      const viewport = get('viewport')
      return [
        viewport.style.getPropertyValue('--reka-navigation-menu-viewport-left'),
        viewport.style.getPropertyValue('--reka-navigation-menu-viewport-top'),
      ].join(',') === [
        `${Math.round(trigger.left - rootRect.left + trigger.width / 2 - 60)}px`,
        `${Math.round(trigger.top - rootRect.top + trigger.height / 2 - 60)}px`,
      ].join(',')
    }).toBe(true)
  })

  it.each(sizelessRoots)('centres the viewport for a root with "$rootStyle" when avoiding clipping, vertical=$vertical', async ({ rootStyle, vertical }) => {
    const { get, open } = mountMenu({ rootStyle, vertical, avoidClipping: true })
    await open('two')
    await expect.poll(() => {
      const trigger = get('two').getBoundingClientRect()
      const viewport = get('viewport')
      const viewportRect = viewport.getBoundingClientRect()
      return Math.abs(vertical
        ? viewportRect.top + viewportRect.height / 2 - trigger.top - trigger.height / 2
        : viewportRect.left + viewportRect.width / 2 - trigger.left - trigger.width / 2)
    }).toBeLessThan(1)
  })

  it('uses the initial containing block when body is only the offsetParent fallback', async () => {
    const previousMarginLeft = document.body.style.marginLeft
    const previousPosition = document.body.style.position
    document.body.style.marginLeft = '40px'
    document.body.style.position = 'static'

    try {
      const { get, open } = mountMenu({ boundaryTransform: 'none', outerPosition: 'static', rootStyle: 'display: contents;', vertical: false, avoidClipping: true })
      await open('two')
      await expect.poll(() => {
        const trigger = get('two').getBoundingClientRect()
        const viewport = get('viewport').getBoundingClientRect()
        return Math.abs(viewport.left + viewport.width / 2 - trigger.left - trigger.width / 2)
      }).toBeLessThan(1)
      expect(get('viewport').offsetParent).toBe(document.body)
    }
    finally {
      document.body.style.marginLeft = previousMarginLeft
      document.body.style.position = previousPosition
    }
  })

  it('uses the body padding edge when body establishes the containing block', async () => {
    const previousMarginLeft = document.body.style.marginLeft
    const previousPosition = document.body.style.position
    document.body.style.marginLeft = '40px'
    document.body.style.position = 'relative'

    try {
      const { get, open } = mountMenu({ boundaryTransform: 'none', outerPosition: 'static', rootStyle: 'display: contents;', vertical: false, avoidClipping: true })
      await open('two')
      await expect.poll(() => {
        const trigger = get('two').getBoundingClientRect()
        const viewport = get('viewport').getBoundingClientRect()
        return Math.abs(viewport.left + viewport.width / 2 - trigger.left - trigger.width / 2)
      }).toBeLessThan(1)
      expect(get('viewport').offsetParent).toBe(document.body)
    }
    finally {
      document.body.style.marginLeft = previousMarginLeft
      document.body.style.position = previousPosition
    }
  })

  it.each([
    { value: 'transform', description: 'a single property' },
    { value: 'filter', description: 'another single property' },
    { value: 'transform, opacity', description: 'comma-separated properties' },
    { value: 'auto', description: 'auto' },
  ])('handles body will-change with $description ($value)', async ({ value }) => {
    const previousMarginLeft = document.body.style.marginLeft
    const previousPosition = document.body.style.position
    const previousWillChange = document.body.style.willChange
    document.body.style.marginLeft = '40px'
    document.body.style.position = 'static'
    document.body.style.willChange = value

    try {
      const { get, open } = mountMenu({ boundaryTransform: 'none', outerPosition: 'static', rootStyle: 'display: contents;', avoidClipping: true })
      await open('two')
      await expect.poll(() => {
        const trigger = get('two').getBoundingClientRect()
        const viewport = get('viewport').getBoundingClientRect()
        return Math.abs(viewport.left + viewport.width / 2 - trigger.left - trigger.width / 2)
      }).toBeLessThan(1)
      expect(get('viewport').offsetParent).toBe(document.body)
    }
    finally {
      document.body.style.marginLeft = previousMarginLeft
      document.body.style.position = previousPosition
      document.body.style.willChange = previousWillChange
    }
  })

  it.each(['content-box', 'border-box'].flatMap(boxSizing => [false, true].map(avoidClipping => ({ boxSizing, avoidClipping }))))('measures the fractional $boxSizing border box after a resize, avoidClipping=$avoidClipping', async ({ boxSizing, avoidClipping }) => {
    const { get, open } = mountMenu({
      avoidClipping,
      rootSize: 300.5,
      scale: '1.002',
      panelSize: document.documentElement.offsetWidth * 2,
      outerStyle: 'left: 420px;',
      rootStyle: `box-sizing: ${boxSizing}; padding: 7.25px; border: 1px solid transparent;`,
    })
    await open('one')
    const assertPosition = () => expect.poll(() => {
      const rootRect = get('root').getBoundingClientRect()
      // By default the position is relative to the root's border edge. Avoiding clipping,
      // it is relative to its padding edge, as absolute positioning is, so the one-pixel
      // border is part of the local coordinate conversion.
      const expected = Math.round((10 - rootRect.left) / 1.002 - (avoidClipping ? 1 : 0))
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

  it.each([
    { scale: '1', rootSize: 300, triggerSize: 100, panelSize: 300 },
    { scale: '0.6', rootSize: 600, triggerSize: 200, panelSize: 500 },
  ])('clamps a horizontal panel to an overflow ancestor under scale($scale)', async ({ scale, rootSize, triggerSize, panelSize }) => {
    const { get, open } = mountClippedMenu({ scale, rootSize, triggerSize, panelSize })
    await open('three')
    await expect.poll(() => {
      const outer = get('outer').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.max(
        Math.abs(viewport.right - (outer.right - 10)),
        outer.left + 10 - viewport.left,
      )
    }).toBeLessThan(1)
  })

  it('includes the root when it clips its viewport', async () => {
    const { get, open } = mountClippedMenu({ outerWidth: 600, outerOverflow: 'visible', panelSize: 260, rootStyle: 'overflow: hidden;' })
    await open('three')
    await expect.poll(() => {
      const root = get('root').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.max(
        Math.abs(viewport.right - (root.right - 10)),
        root.left + 10 - viewport.left,
      )
    }).toBeLessThan(1)
  })

  it('includes a clipping wrapper between the root and viewport', async () => {
    const { get, open } = mountClippedMenu({ outerWidth: 600, outerOverflow: 'visible', panelSize: 260, viewportWrapperStyle: 'width: 280px; height: 300px; overflow: hidden;' })
    await open('three')
    await expect.poll(() => {
      const wrapper = get('viewport-wrapper').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.max(
        Math.abs(viewport.right - (wrapper.right - 10)),
        wrapper.left + 10 - viewport.left,
      )
    }).toBeLessThan(1)
  })

  it('does not clamp to a static overflow wrapper outside the viewport containing block', async () => {
    const { get, open } = mountClippedMenu({
      outerWidth: 600,
      outerOverflow: 'visible',
      panelSize: 260,
      viewportWrapperStyle: 'position: static; width: 100px; height: 300px; margin-top: -100px; overflow: hidden;',
    })
    await open('one')
    await expect.poll(() => {
      const root = get('root').getBoundingClientRect()
      const trigger = get('one').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const centerOffset = Math.abs(viewport.left + viewport.width / 2 - trigger.left - trigger.width / 2)
      const visibleOutsideWrapper = document.elementFromPoint(root.left + 150, root.top + 50)?.closest('[data-testid="one-content"]') === get('one-content')
      return Math.max(centerOffset, visibleOutsideWrapper ? 0 : 1)
    }).toBeLessThan(1)
    expect(get('viewport').offsetParent).toBe(get('root'))
  })

  const shiftedWrapperCases = [
    { scale: '0.6', rootSize: 600, triggerSize: 200, panelSize: 400, wrapperSize: 560 },
    { scale: '1', rootSize: 300, triggerSize: 100, panelSize: 260, wrapperSize: 280 },
    { scale: '1.5', rootSize: 300, triggerSize: 100, panelSize: 260, wrapperSize: 280 },
  ]

  it.each(shiftedWrapperCases)('clamps to a positioned wrapper that contains the viewport under scale($scale)', async ({ scale, rootSize, triggerSize, panelSize, wrapperSize }) => {
    const { get, open } = mountClippedMenu({
      scale,
      rootSize,
      triggerSize,
      outerWidth: 600,
      outerOverflow: 'visible',
      panelSize,
      viewportWrapperStyle: `left: 20px; width: ${wrapperSize}px; height: ${rootSize}px; overflow: hidden;`,
    })
    await open('three')
    await expect.poll(() => {
      const wrapper = get('viewport-wrapper').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.max(
        Math.abs(viewport.right - (wrapper.right - 10)),
        wrapper.left + 10 - viewport.left,
      )
    }).toBeLessThan(1)
    expect(get('viewport').offsetParent).toBe(get('viewport-wrapper'))
  })

  it('preserves paint containment on a static wrapper', async () => {
    const { get, open } = mountClippedMenu({
      outerWidth: 600,
      outerOverflow: 'visible',
      panelSize: 260,
      viewportWrapperStyle: 'position: static; width: 100px; height: 300px; margin-top: -100px; contain: paint; overflow: visible;',
    })
    await open('one')
    await expect.poll(() => {
      const wrapper = get('viewport-wrapper').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left - (wrapper.left + 10))
    }).toBeLessThan(1)
  })

  it('uses a static paint-containment wrapper as the viewport containing block', async () => {
    const { get, open } = mountClippedMenu({
      outerWidth: 1000,
      outerOverflow: 'visible',
      panelSize: 100,
      viewportWrapperStyle: 'position: static; width: 300px; height: 300px; margin-left: 100px; margin-top: -100px; contain: paint; overflow: visible;',
    })
    await open('three')
    await expect.poll(() => {
      const trigger = get('three').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left + viewport.width / 2 - trigger.left - trigger.width / 2)
    }).toBeLessThan(1)
    expect(get('viewport').offsetParent).toBe(get('viewport-wrapper'))
  })

  it.each(shiftedWrapperCases)('converts a vertical position to a shifted wrapper containing block under scale($scale)', async ({ scale, rootSize, triggerSize, panelSize, wrapperSize }) => {
    const { get, open } = mountClippedMenu({
      scale,
      rootSize,
      triggerSize,
      vertical: true,
      outerWidth: 600,
      outerHeight: 600,
      outerOverflow: 'visible',
      panelSize,
      viewportWrapperStyle: `top: 20px; width: ${rootSize}px; height: ${wrapperSize}px; overflow: hidden;`,
    })
    await open('three')
    await expect.poll(() => {
      const wrapper = get('viewport-wrapper').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.max(
        Math.abs(viewport.bottom - (wrapper.bottom - 10)),
        wrapper.top + 10 - viewport.top,
      )
    }).toBeLessThan(1)
    expect(get('viewport').offsetParent).toBe(get('viewport-wrapper'))
  })

  it.each(alignments)('aligns a horizontal viewport using the wrapper scale at %s alignment', async (align) => {
    const { get, open } = mountClippedMenu({
      align,
      outerWidth: 1000,
      outerOverflow: 'visible',
      panelSize: 100,
      rootSize: 600,
      triggerSize: 100,
      viewportWrapperStyle: 'width: 600px; height: 300px; overflow: visible; transform: scale(2); transform-origin: top left;',
    })
    await open('two')
    await expect.poll(() => {
      const trigger = get('two').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const fraction = align === 'start' ? 0 : align === 'end' ? 1 : 0.5
      return Math.abs(viewport.left + viewport.width * fraction - trigger.left - trigger.width * fraction)
    }).toBeLessThan(1)
  })

  it.each(alignments)('aligns a vertical viewport using the wrapper scale at %s alignment', async (align) => {
    const { get, open } = mountClippedMenu({
      align,
      vertical: true,
      outerHeight: 1000,
      outerWidth: 1000,
      outerOverflow: 'visible',
      panelSize: 100,
      rootSize: 600,
      triggerSize: 100,
      viewportWrapperStyle: 'width: 300px; height: 600px; overflow: visible; transform: scale(2); transform-origin: top left;',
    })
    await open('two')
    await expect.poll(() => {
      const trigger = get('two').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const fraction = align === 'start' ? 0 : align === 'end' ? 1 : 0.5
      return Math.abs(viewport.top + viewport.height * fraction - trigger.top - trigger.height * fraction)
    }).toBeLessThan(1)
  })

  it.each([
    { scale: '1', rootSize: 300, triggerSize: 100, panelSize: 300 },
    { scale: '0.6', rootSize: 600, triggerSize: 200, panelSize: 400 },
  ])('clips to the padding edge of a bordered ancestor under scale($scale)', async ({ scale, rootSize, triggerSize, panelSize }) => {
    const border = 20
    const { get, open } = mountClippedMenu({
      scale,
      rootSize,
      triggerSize,
      panelSize,
      outerWidth: 400,
      outerStyle: `box-sizing: border-box; border: ${border}px solid transparent;`,
    })
    await open('three')
    await expect.poll(() => {
      const outer = get('outer').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const paddingLeft = outer.left + border
      const paddingRight = outer.right - border
      return Math.max(
        Math.abs(viewport.right - (paddingRight - 10)),
        paddingLeft + 10 - viewport.left,
      )
    }).toBeLessThan(1)
  })

  it('clamps to the document, not a clipping ancestor, by default', async () => {
    const { get, open } = mountClippedMenu({ avoidClipping: false })
    await open('three')
    await expect.poll(() => {
      const trigger = get('three').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left + viewport.width / 2 - trigger.left - trigger.width / 2)
    }).toBeLessThan(1)
    expect(get('viewport').getBoundingClientRect().right).toBeGreaterThan(get('outer').getBoundingClientRect().right)
  })

  it('preserves the document boundary when no ancestor clips', async () => {
    const { get, open } = mountMenu({ outerStyle: 'left: calc(100vw - 100px);', panelSize: 260, avoidClipping: true })
    await open('one')
    await expect.poll(() => Math.abs(get('viewport').getBoundingClientRect().right - (document.documentElement.offsetWidth - 10))).toBeLessThan(1)
  })

  it('clamps a vertical panel to an overflow ancestor', async () => {
    const { get, open } = mountClippedMenu({ vertical: true, outerHeight: 300, panelSize: 260 })
    await open('three')
    await expect.poll(() => {
      const outer = get('outer').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.max(
        Math.abs(viewport.bottom - (outer.bottom - 10)),
        outer.top + 10 - viewport.top,
      )
    }).toBeLessThan(1)
  })

  it.each(alignments)('preserves %s alignment inside an overflow ancestor when unclamped', async (align) => {
    const { get, open } = mountClippedMenu({ align, panelSize: 120 })
    await open('two')
    await expect.poll(() => {
      const trigger = get('two').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const fraction = align === 'start' ? 0 : align === 'end' ? 1 : 0.5
      return Math.abs(viewport.left + viewport.width * fraction - trigger.left - trigger.width * fraction)
    }).toBeLessThan(1)
  })

  it.each([
    { align: 'start' as const, trigger: 'one', edge: 'leading' },
    { align: 'center' as const, trigger: 'three', edge: 'trailing' },
  ])('intersects multiple clipping ancestors at the $edge edge', async ({ align, trigger, edge }) => {
    const { get, open } = mountClippedMenu({
      align,
      outerWidth: 300,
      rootSize: 340,
      panelSize: 220,
      boundaryStyle: 'left: 20px; width: 340px; height: 300px; overflow: hidden; transform: none;',
    })
    await open(trigger)
    await expect.poll(() => {
      const outer = get('outer').getBoundingClientRect()
      const boundary = get('boundary').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const expectedLeft = edge === 'leading' ? boundary.left + 10 : outer.right - 10 - viewport.width
      const expectedRight = edge === 'leading' ? expectedLeft + viewport.width : outer.right - 10
      return Math.max(
        Math.abs(viewport.left - expectedLeft),
        Math.abs(viewport.right - expectedRight),
      )
    }).toBeLessThan(1)
  })

  it('honors paint containment as a clipping boundary', async () => {
    const { get, open } = mountClippedMenu({
      outerWidth: 600,
      panelSize: 240,
      outerOverflow: 'visible',
      boundaryStyle: 'contain: paint; overflow: visible;',
    })
    await open('three')
    await expect.poll(() => {
      const boundary = get('boundary').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.right - (boundary.right - 10))
    }).toBeLessThan(1)
  })

  it('ignores paint containment on a boxless display contents ancestor', async () => {
    const { get, open } = mountClippedMenu({
      outerWidth: 600,
      outerOverflow: 'visible',
      outerStyle: 'left: 800px;',
      boundaryStyle: 'display: contents; contain: paint; overflow: visible; transform: none;',
      panelSize: 260,
    })
    await open('one')
    await expect.poll(() => {
      const trigger = get('one').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left + viewport.width / 2 - (trigger.left + trigger.width / 2))
    }).toBeLessThan(1)
  })

  it('ignores paint containment on a non-atomic inline ancestor', async () => {
    const { get, open } = mountClippedMenu({
      outerWidth: 600,
      outerOverflow: 'visible',
      outerStyle: 'left: 800px;',
      boundaryStyle: 'display: inline; contain: paint; overflow: hidden; transform: none;',
      panelSize: 260,
    })
    await open('one')
    await expect.poll(() => {
      const trigger = get('one').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left + viewport.width / 2 - (trigger.left + trigger.width / 2))
    }).toBeLessThan(1)
  })

  it.each(['block', 'flex', 'grid', 'inline-block', 'inline-flex', 'inline-grid'])('keeps %s as a clipping ancestor', async (display) => {
    const { get, open } = mountClippedMenu({
      outerWidth: 600,
      outerOverflow: 'visible',
      boundaryStyle: `display: ${display}; width: 280px; height: 300px; overflow: hidden; transform: none;`,
      panelSize: 260,
    })
    await open('three')
    await expect.poll(() => {
      const boundary = get('boundary').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      return Math.max(
        Math.abs(viewport.right - (boundary.right - 10)),
        boundary.left + 10 - viewport.left,
      )
    }).toBeLessThan(1)
  })

  it('uses the scrollport edge when an overflow ancestor has scrollbars', async () => {
    const { get, open } = mountClippedMenu({ outerWidth: 360, outerHeight: 360, outerOverflow: 'auto', panelSize: 300, rootSize: 600 })
    await open('three')
    await expect.poll(() => {
      const outer = get('outer').getBoundingClientRect()
      const viewport = get('viewport').getBoundingClientRect()
      const scrollportLeft = outer.left + get('outer').clientLeft
      const scrollportRight = scrollportLeft + get('outer').clientWidth
      return Math.max(
        Math.abs(viewport.right - (scrollportRight - 10)),
        scrollportLeft + 10 - viewport.left,
      )
    }).toBeLessThan(1)
  })

  it('keeps an oversized panel at the clipping ancestor leading edge', async () => {
    const { get, open } = mountClippedMenu({ outerWidth: 300, panelSize: 500 })
    await open('three')
    await expect.poll(() => {
      const outer = get('outer').getBoundingClientRect()
      return Math.abs(get('viewport').getBoundingClientRect().left - (outer.left + 10))
    }).toBeLessThan(1)
  })

  it('updates the clipping boundary after an ancestor resizes', async () => {
    const { get, open } = mountClippedMenu({ outerWidth: 400, panelSize: 300 })
    await open('three')
    const outer = get('outer')
    const before = get('viewport').getBoundingClientRect().right
    outer.style.width = '340px'
    await expect.poll(() => get('viewport').getBoundingClientRect().right).toBeLessThan(before - 40)
    await expect.poll(() => {
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.right - (outer.getBoundingClientRect().right - 10))
    }).toBeLessThan(1)
  })

  it('updates the clipping boundary when content-box ancestor padding changes', async () => {
    const { get, open } = mountClippedMenu({
      align: 'start',
      outerStyle: 'box-sizing: content-box; padding-left: 40px; padding-right: 0;',
      outerWidth: 360,
      panelSize: 300,
      rootSize: 600,
    })
    await open('one')
    const outer = get('outer')
    const contentWidth = getComputedStyle(outer).width
    const before = get('viewport').getBoundingClientRect().left
    outer.style.paddingLeft = '0px'
    await expect.poll(() => {
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left - (outer.getBoundingClientRect().left + 10))
    }).toBeLessThan(1)
    expect(getComputedStyle(outer).width).toBe(contentWidth)
    expect(get('viewport').getBoundingClientRect().left).toBeLessThan(before - 20)
  })

  it('updates the clipping boundary when fixed border-box ancestor padding changes', async () => {
    const { get, open } = mountClippedMenu({
      align: 'start',
      outerStyle: 'box-sizing: border-box; padding-left: 40px; padding-right: 0;',
      outerWidth: 360,
      panelSize: 120,
      rootSize: 600,
    })
    await open('one')
    const outer = get('outer')
    const borderBoxWidth = outer.getBoundingClientRect().width
    const before = get('viewport').getBoundingClientRect().left
    outer.style.paddingLeft = '0px'
    await expect.poll(() => {
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left - (outer.getBoundingClientRect().left + 10))
    }).toBeLessThan(1)
    expect(outer.getBoundingClientRect().width).toBe(borderBoxWidth)
    expect(get('viewport').getBoundingClientRect().left).toBeLessThan(before - 20)
  })

  it('updates the clipping boundary after an ancestor scrolls', async () => {
    const { get, open } = mountClippedMenu({ rootSize: 600, panelSize: 300, outerOverflow: 'auto' })
    await open('one')
    const outer = get('outer')
    outer.scrollTo({ left: 120, top: 0 })
    await expect.poll(() => outer.scrollLeft).toBe(120)
    await expect.poll(() => {
      const viewport = get('viewport').getBoundingClientRect()
      return Math.abs(viewport.left - (outer.getBoundingClientRect().left + 10))
    }).toBeLessThan(1)
  })
})
