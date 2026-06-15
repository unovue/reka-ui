import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

const oldFile = {
  name: 'app.ts',
  contents: 'const message = "old"\n',
}

const newFile = {
  name: 'app.ts',
  contents: 'const message = "new"\n',
}

const unresolvedFile = {
  name: 'app.ts',
  contents: [
    '<<<<<<< HEAD',
    'const message = "old"',
    '=======',
    'const message = "new"',
    '>>>>>>> branch',
    '',
  ].join('\n'),
}

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
        oldFile,
        newFile,
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

  it('supports asChild composition', async () => {
    const { MultiFileDiff } = await import('.')
    const wrapper = mount(MultiFileDiff, {
      attachTo: document.body,
      props: {
        asChild: true,
        oldFile,
        newFile,
        options: {
          disableErrorHandling: true,
          diffStyle: 'unified',
        },
      },
      slots: {
        default: '<div data-diff-host />',
      },
    })

    await nextTick()

    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
    expect(wrapper.attributes('data-diff-host')).toBe('')
  })
})

describe('given Diff primitive wrappers', () => {
  it('supports asChild for file, diff, and unresolved file wrappers', async () => {
    const { DiffFile, FileDiff, UnresolvedFile } = await import('.')
    const { parseDiffFromFile } = await import('@pierre/diffs')
    const cases = [
      {
        component: DiffFile,
        props: {
          file: newFile,
        },
      },
      {
        component: FileDiff,
        props: {
          fileDiff: parseDiffFromFile(oldFile, newFile),
        },
      },
      {
        component: UnresolvedFile,
        props: {
          file: unresolvedFile,
        },
      },
    ]

    for (const { component, props } of cases) {
      const wrapper = mount(component, {
        attachTo: document.body,
        props: {
          asChild: true,
          options: {
            disableErrorHandling: true,
            diffStyle: 'unified',
          },
          ...props,
        },
        slots: {
          default: '<div data-diff-host />',
        },
      })

      await nextTick()

      expect(wrapper.element.tagName.toLowerCase()).toBe('div')
      expect(wrapper.attributes('data-diff-host')).toBe('')
    }
  })
})
