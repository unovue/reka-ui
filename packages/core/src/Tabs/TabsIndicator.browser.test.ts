import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '.'

// The indicator follows the selected tab's size and position, through a tab switch and
// through a resize of the tabs, in each of several tab lists on the page.

// A component of its own, so that the page re-rendering does not reset the tab widths a test sets.
const Tabs = defineComponent({
  props: { name: { type: String, required: true }, widths: { type: Array, required: true } },
  setup: props => () => tabs(props.name, props.widths as number[]),
})

function tabs(name: string, widths: number[]) {
  return h(TabsRoot, { defaultValue: '0' }, () => h(TabsList, { 'data-testid': `${name}-list`, 'style': 'position: relative; display: flex' }, () => [
    h(TabsIndicator, { 'data-testid': `${name}-indicator` }),
    // The tab's own styles are re-applied when it re-renders, so the test resizes its content.
    ...widths.map((width, index) => h(TabsTrigger, { value: String(index), style: 'padding: 0; border: 0' }, () => h('span', { 'data-testid': `${name}-${index}`, 'style': `display: inline-block; width: ${width}px` }))),
  ]))
}

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
function indicator(name: string) {
  const style = get(`${name}-indicator`)?.style
  return style && [style.getPropertyValue('--reka-tabs-indicator-size'), style.getPropertyValue('--reka-tabs-indicator-position')]
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('tabs indicator, in a real browser', () => {
  it('follows the selected tab and its resizes, in each tab list', async () => {
    const second = ref(true)
    mount(defineComponent({
      setup: () => () => [h(Tabs, { name: 'a', widths: [40, 60] }), second.value ? h(Tabs, { name: 'b', widths: [30, 50] }) : null],
    }), { attachTo: document.body })

    await expect.poll(() => indicator('a')).toEqual(['40px', '0px'])
    await expect.poll(() => indicator('b')).toEqual(['30px', '0px'])

    await userEvent.click(get('a-1')!.parentElement!)
    await expect.poll(() => indicator('a')).toEqual(['60px', '40px'])
    expect(indicator('b')).toEqual(['30px', '0px'])

    get('b-0')!.style.width = '35px'
    await expect.poll(() => indicator('b')).toEqual(['35px', '0px'])
    get('a-0')!.style.width = '45px'
    await expect.poll(() => indicator('a')).toEqual(['60px', '45px'])

    // The other list keeps following its tabs once one is unmounted.
    second.value = false
    await expect.poll(() => get('b-list')).toBeNull()
    get('a-1')!.style.width = '70px'
    await expect.poll(() => indicator('a')).toEqual(['70px', '45px'])
  })

  it('follows the tabs it mounts with inside a list that is already there', async () => {
    const shown = ref(false)
    mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: '0' }, () => h(TabsList, { style: 'position: relative; display: flex; width: 300px; height: 40px' }, () => shown.value
        ? [
            h(TabsIndicator, { 'data-testid': 'late-indicator' }),
            h(TabsTrigger, { value: '0', style: 'padding: 0; border: 0' }, () => h('span', { 'data-testid': 'late-0', 'style': 'display: inline-block; width: 40px' })),
          ]
        : [])),
    }), { attachTo: document.body })

    shown.value = true
    await expect.poll(() => indicator('late')).toEqual(['40px', '0px'])
    get('late-0')!.style.width = '55px'
    await expect.poll(() => indicator('late')).toEqual(['55px', '0px'])
  })
})
