import type { VueWrapper } from '@vue/test-utils'
import { findByAltText, findByText, queryByText, waitForElementToBeRemoved } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick, ref } from 'vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from '.'
import Avatar from './story/_Avatar.vue'

const FALLBACK = 'CT'
const DELAY = 350

const ImgClass = class MockImage {
  onload: () => void = () => {}
  src = ''
  eventListeners: Record<string, Array<() => void>> = {}

  constructor() {
    setTimeout(() => {
      this.onload()
      // Also trigger 'load' event listeners
      if (this.eventListeners.load) {
        this.eventListeners.load.forEach(callback => callback())
      }
    }, DELAY)
    return this
  }

  addEventListener(event: string, callback: () => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  removeEventListener(event: string, callback: () => void) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    }
  }
}

it('should pass axe accessibility tests', async () => {
  const wrapper = mount(Avatar)
  expect(await axe(wrapper.element)).toHaveNoViolations()
})

describe('given an Avatar with fallback and a working image', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Avatar>>
  beforeAll(async () => {
    (window.Image as any) = ImgClass
    // Attached so `toHaveStyle` can read computed styles: detached elements have none.
    wrapper = mount(Avatar, { attachTo: document.body })
  })

  afterAll(() => wrapper.unmount())

  it('should render the fallback initially', async () => {
    await nextTick()
    expect(wrapper.html()).includes(FALLBACK)
  })

  it('should render the image, but show `display:none` initially', () => {
    const image = wrapper.find('img')
    expect(image.exists()).toBeTruthy()
    expect(image.element).toHaveStyle({ display: 'none' })
  })

  it('should have alt text on the image', async () => {
    const image = await findByAltText(wrapper.element as HTMLElement, 'Colm Tuite')
    expect(image).toBeTruthy()
  })

  it('should match before image loaded snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should match after image loaded snapshot', async () => {
    await waitForElementToBeRemoved(() => queryByText(wrapper.element as HTMLElement, 'CT'))
    expect(wrapper.html()).toMatchSnapshot()
  })
})

describe('given an Avatar with fallback and delayed render', () => {
  let wrapper: VueWrapper<InstanceType<typeof Avatar>>

  beforeAll(async () => {
    (window.Image as any) = ImgClass
    wrapper = mount(Avatar, {
      props: {
        delay: 300,
      },
    })
  })

  it('should not render a fallback immediately', async () => {
    expect(wrapper.text()).not.toContain(FALLBACK)
  })

  it('should render a fallback after the delay', async () => {
    expect(wrapper.text()).not.toContain(FALLBACK)
    const fallback = await findByText(wrapper.element as HTMLElement, FALLBACK)
    expect(wrapper.element).toContain(fallback)
  })
})

describe('given an Avatar whose image unmounts and remounts', () => {
  it('should show fallback again after AvatarImage unmounts and hide it when remounted', async () => {
    ;(window.Image as any) = ImgClass
    const showImage = ref(true)
    const wrapper = mount({
      components: { AvatarRoot, AvatarImage, AvatarFallback },
      setup: () => ({ showImage }),
      template: `
        <AvatarRoot>
          <AvatarImage v-if="showImage" src="https://example.com/avatar.png" alt="User" />
          <AvatarFallback>${FALLBACK}</AvatarFallback>
        </AvatarRoot>
      `,
    })

    // Wait for image to load so fallback is removed
    await waitForElementToBeRemoved(() => queryByText(wrapper.element as HTMLElement, FALLBACK))
    expect(wrapper.find('img').exists()).toBe(true)

    // Unmount AvatarImage -> fallback should appear again
    showImage.value = false
    await nextTick()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain(FALLBACK)

    // Remount AvatarImage -> fallback stays visible while loading, then hides on load
    showImage.value = true
    await nextTick()
    expect(wrapper.find('img').exists()).toBe(true)
    await waitForElementToBeRemoved(() => queryByText(wrapper.element as HTMLElement, FALLBACK))
    expect(wrapper.text()).not.toContain(FALLBACK)

    wrapper.unmount()
  })

  it('should not leave root status stuck at idle when swapping keyed AvatarImage instances', async () => {
    ;(window.Image as any) = ImgClass
    const useFirst = ref(true)
    const wrapper = mount({
      components: { AvatarRoot, AvatarImage, AvatarFallback },
      setup: () => ({ useFirst }),
      template: `
        <AvatarRoot>
          <AvatarImage v-if="useFirst" key="first" src="https://example.com/a.png" alt="First" />
          <AvatarImage v-else key="second" src="https://example.com/b.png" alt="Second" />
          <AvatarFallback>${FALLBACK}</AvatarFallback>
        </AvatarRoot>
      `,
    })

    await waitForElementToBeRemoved(() => queryByText(wrapper.element as HTMLElement, FALLBACK))

    useFirst.value = false
    await nextTick()
    expect(wrapper.find('img').attributes('alt')).toBe('Second')
    await waitForElementToBeRemoved(() => queryByText(wrapper.element as HTMLElement, FALLBACK))
    expect(wrapper.text()).not.toContain(FALLBACK)

    wrapper.unmount()
  })
})
