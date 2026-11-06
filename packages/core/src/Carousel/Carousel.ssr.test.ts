// @vitest-environment node
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import {
  CarouselAutoplayToggle,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot,
  CarouselViewport,
} from '.'

function render(props: Record<string, unknown> = {}, count = 4) {
  return renderToString(createSSRApp({
    render: () => h(CarouselRoot, { 'aria-label': 'Server', ...props }, {
      default: ({ snapCount }: { snapCount: number }) => [
        h(CarouselAutoplayToggle, () => 'Toggle'),
        h(CarouselViewport, () => h(CarouselContent, () =>
          Array.from({ length: count }, (_, i) => h(CarouselItem, { key: i }, () => `Slide ${i + 1}`)))),
        h(CarouselPrevious, () => 'Prev'),
        h(CarouselNext, () => 'Next'),
        ...Array.from({ length: snapCount }, (_, index) => h(CarouselIndicator, { key: index, index })),
      ],
    }),
  }))
}

/** The opening tag of the element carrying `attr`. */
function tag(html: string, attr: string) {
  return html.match(new RegExp(`<[^>]*${attr}[^>]*>`))?.[0] ?? ''
}

// Runs without jsdom: on a real server there is no `document` or `window`.
describe('given a Carousel rendered on the server', () => {
  it('has no DOM globals', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('renders every option without touching the DOM', async () => {
    const options = [
      {},
      { loop: true },
      { fade: true },
      { orientation: 'vertical' },
      { dir: 'rtl' },
      { align: 'center', slidesToScroll: 2 },
      { slidesToScroll: 'auto', containScroll: false },
      { dragFree: true, skipSnaps: true, draggable: false },
      { autoHeight: true, wheel: true, inViewThreshold: 0.5 },
      { autoplay: { delay: 1000 } },
      { autoScroll: true },
      { itemCount: 4, defaultValue: 2 },
    ]
    for (const props of options)
      expect(await render(props)).toContain('aria-roledescription="carousel"')
  })

  it('renders a native scroll-snap track that scrolls before hydration', async () => {
    const html = await render()
    expect(tag(html, 'tabindex="0"')).toMatch(/overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory/)
    expect(tag(html, 'aria-live')).toContain('display:flex')
    const first = tag(html, 'data-index="0"')
    expect(first).toContain('flex-shrink:0')
    expect(first).toContain('scroll-snap-align:start')
    expect(first).toContain('scroll-snap-stop:always')
  })

  it('renders a vertical track on the y axis', async () => {
    const html = await render({ orientation: 'vertical' })
    expect(tag(html, 'tabindex="0"')).toMatch(/overflow-x:hidden;overflow-y:auto;scroll-snap-type:y mandatory/)
    expect(tag(html, 'aria-live')).toContain('flex-direction:column')
  })

  it('renders the current slide active and starts on defaultValue', async () => {
    const html = await render({ defaultValue: 2 })
    expect(html.match(/data-active/g)).toHaveLength(1)
    expect(tag(html, 'data-index="2"')).toContain('data-active')
    expect(tag(html, 'data-index="2"')).toContain('scroll-initial-target:nearest')
    expect(html.match(/scroll-initial-target/g)).toHaveLength(1)
  })

  it('renders the current group active with slidesToScroll', async () => {
    const html = await render({ slidesToScroll: 2, defaultValue: 1 })
    expect(tag(html, 'data-index="2"')).toContain('data-active')
    expect(tag(html, 'data-index="3"')).toContain('data-active')
    expect(tag(html, 'data-index="0"')).not.toContain('data-active')
  })

  it('keeps every slide reachable while the scroll track is unmeasured', async () => {
    const html = await render()
    expect(html).not.toContain('inert')
    expect(html).not.toContain('aria-hidden')
  })

  it('stacks the slides and hides the inactive ones with fade', async () => {
    const html = await render({ fade: true, defaultValue: 1 })
    expect(tag(html, 'aria-live')).toContain('display:grid')
    expect(tag(html, 'data-index="1"')).toContain('opacity:1')
    expect(tag(html, 'data-index="0"')).toContain('opacity:0')
    expect(tag(html, 'data-index="0"')).toContain('inert')
    expect(tag(html, 'data-index="0"')).toContain('aria-hidden="true"')
    expect(html.match(/inert/g)).toHaveLength(3)
  })

  it('renders the indicators, the controls and the slide labels from itemCount', async () => {
    const html = await render({ itemCount: 4 })
    expect(html.match(/aria-label="Go to slide/g)).toHaveLength(4)
    expect(tag(html, 'aria-label="Next slide"')).not.toContain('disabled')
    expect(tag(html, 'aria-label="Previous slide"')).toContain('disabled')
    expect(tag(html, 'data-index="1"')).toContain('aria-label="2 of 4"')
  })

  it('renders no indicators and no slide labels without itemCount', async () => {
    const html = await render()
    expect(html).not.toContain('Go to slide')
    expect(html).not.toContain(' of 4"')
    expect(tag(html, 'aria-label="Next slide"')).toContain('disabled')
  })

  it('enables both controls with loop and itemCount', async () => {
    const html = await render({ loop: true, itemCount: 4 })
    expect(tag(html, 'aria-label="Previous slide"')).not.toContain('disabled')
    expect(tag(html, 'aria-label="Next slide"')).not.toContain('disabled')
  })

  it('renders rotation as playing, with the live region off', async () => {
    const html = await render({ autoplay: true })
    expect(tag(html, 'aria-roledescription="carousel"')).toContain('data-playing')
    expect(tag(html, 'aria-live')).toContain('aria-live="off"')
    expect(html).toContain('aria-label="Stop slide rotation"')
  })

  it('points the controls at the content id', async () => {
    const html = await render({ itemCount: 4 })
    const id = tag(html, 'aria-live').match(/id="([^"]+)"/)?.[1]
    expect(id).toBeTruthy()
    expect(tag(html, 'aria-label="Next slide"')).toContain(`aria-controls="${id}"`)
    expect(tag(html, 'aria-label="Go to slide 1"')).toContain(`aria-controls="${id}"`)
  })
})
