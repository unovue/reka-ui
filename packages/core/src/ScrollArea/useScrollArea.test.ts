import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, mergeProps, onMounted, ref } from 'vue'
import * as Reka from '../index'
import { useScrollArea } from './useScrollArea'

describe('useScrollArea', () => {
  it('defaults to hover / ltr / 600ms and exposes the corner variables on the root', () => {
    const { root, context } = useScrollArea()
    expect(context.type.value).toBe('hover')
    expect(context.scrollHideDelay.value).toBe(600)
    expect(root.attrs.value.dir).toBe('ltr')
    expect(root.attrs.value.style).toMatchObject({
      'position': 'relative',
      '--reka-scroll-area-corner-width': '0px',
      '--reka-scroll-area-corner-height': '0px',
    })
    context.onCornerWidthChange(12)
    expect(root.attrs.value.style['--reka-scroll-area-corner-width']).toBe('12px')
  })

  it('follows dir and opens the viewport overflow per enabled scrollbar', () => {
    const dir = ref<'ltr' | 'rtl'>('rtl')
    const { root, viewport, content, context } = useScrollArea({ dir })
    expect(root.attrs.value.dir).toBe('rtl')
    expect(viewport.attrs.value).toMatchObject({ 'data-reka-scroll-area-viewport': '', 'tabindex': 0 })
    expect(viewport.attrs.value.style).toEqual({ overflowX: 'hidden', overflowY: 'hidden' })

    context.onScrollbarYEnabledChange(true)
    expect(viewport.attrs.value.style).toEqual({ overflowX: 'hidden', overflowY: 'scroll' })
    context.onScrollbarXEnabledChange(true)
    expect(viewport.attrs.value.style.overflowX).toBe('scroll')
    expect(content.attrs.value.style.minWidth).toBe('fit-content')
  })

  it('scrollTop / scrollTopLeft scroll the registered viewport', () => {
    const { scrollTop, scrollTopLeft, context, viewportElement } = useScrollArea()
    const element = document.createElement('div')
    element.scrollTo = vi.fn() as any
    context.onViewportChange(element)
    expect(viewportElement.value).toBe(element)
    scrollTop()
    expect(element.scrollTo).toHaveBeenLastCalledWith({ top: 0 })
    scrollTopLeft()
    expect(element.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0 })
  })

  it('renders standalone and passes axe', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        const viewportEl = ref<HTMLElement>()
        const { root, viewport, content, context } = useScrollArea({ type: 'always' })
        onMounted(() => {
          context.onViewportChange(viewportEl.value!)
          context.onScrollbarYEnabledChange(true)
        })
        return () => h('div', root.attrs.value, [
          h('div', mergeProps(viewport.attrs.value, { ref: viewportEl, style: { height: '100px' } }), [
            h('div', content.attrs.value, 'Long content'),
          ]),
        ])
      },
    }), { attachTo: document.body })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-reka-scroll-area-viewport]').attributes('style')).toContain('overflow-y: scroll')
    expect(await axe(wrapper.element)).toHaveNoViolations()
    wrapper.unmount()
  })

  it('is exported from the package barrel', () => {
    expect(typeof Reka.useScrollArea).toBe('function')
  })
})
