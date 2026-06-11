import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver

  if (typeof CSSStyleSheet === 'undefined') {
    Object.defineProperty(globalThis, 'CSSStyleSheet', {
      value: class CSSStyleSheetMock {
        replaceSync() {}
      },
    })
  }
  else if (!('replaceSync' in CSSStyleSheet.prototype)) {
    CSSStyleSheet.prototype.replaceSync = () => {}
  }
})

describe('given a MultiFileDiff', () => {
  it('renders a Pierre diff container and updates file changes', async () => {
    const { MultiFileDiff } = await import('.')
    const wrapper = mount(MultiFileDiff, {
      attachTo: document.body,
      props: {
        oldFile: {
          name: 'app.ts',
          contents: 'const message = "old"\n',
        },
        newFile: {
          name: 'app.ts',
          contents: 'const message = "new"\n',
        },
        options: {
          disableErrorHandling: true,
          diffStyle: 'unified',
        },
      },
    })

    await nextTick()

    expect(wrapper.element.tagName.toLowerCase()).toBe('diffs-container')

    await wrapper.setProps({
      newFile: {
        name: 'app.ts',
        contents: 'const message = "updated"\n',
      },
    })
    await nextTick()

    expect(wrapper.element.tagName.toLowerCase()).toBe('diffs-container')
  })
})
