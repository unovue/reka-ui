import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, onUpdated, ref } from 'vue'
import PopperRenders from './_PopperRenders.vue'
import PopperAnchor from './PopperAnchor.vue'
import PopperContent from './PopperContent.vue'
import PopperRoot from './PopperRoot.vue'

async function settle() {
  for (let i = 0; i < 4; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
    await nextTick()
  }
}

describe('given PopperContent while it is placed', () => {
  let wrapper: ReturnType<typeof mount> | undefined
  afterEach(() => wrapper?.unmount())

  it.each([
    ['without memoDependencies', {}],
    ['with memoDependencies', { memoDependencies: [] }],
  ])('should render its content once to mount and once when placed, %s', async (_, extra) => {
    let contentRenders = 0
    let childUpdates = 0
    const placed: number[] = []
    const Child = defineComponent({
      setup(_, { slots }) {
        onUpdated(() => childUpdates++)
        return () => h('span', slots.default?.())
      },
    })
    wrapper = mount(defineComponent({
      setup: () => () => h(PopperRoot, null, () => [
        h(PopperAnchor, { style: 'position: fixed; top: 100px; left: 100px; width: 80px; height: 20px' }, () => 'Anchor'),
        h(PopperContent, { 'data-testid': 'content', 'dir': 'rtl', 'style': 'width: 100px; height: 40px', 'onPlaced': () => placed.push(contentRenders), ...extra }, {
          default: () => {
            contentRenders++
            return h(Child, null, () => 'Content')
          },
        }),
      ]),
    }), { attachTo: document.body })

    await settle()
    const content = document.querySelector<HTMLElement>('[data-testid="content"]')!
    expect(content.dataset.side).toBe('bottom')
    expect(content.getAttribute('dir')).toBe('rtl')
    expect(content.style.animation).toBe('')
    expect(content.parentElement!.style.zIndex).toBe('auto')
    expect(content.parentElement!.style.transform).not.toContain('-200%')
    expect(placed.length).toBe(1)
    expect({ contentRenders, childUpdates }).toEqual({ contentRenders: 2, childUpdates: 1 })
  })

  it('should render new slot content, attributes and reactive state of the content', async () => {
    // Not reactive: only a new slot function from the parent can bring it in
    let plain = 'one'
    const tick = ref(0)
    const reactive = ref('a')
    const state = ref('closed')
    wrapper = mount(defineComponent({
      setup: () => () => h(PopperRoot, { 'data-tick': tick.value }, () => [
        h(PopperAnchor, { style: 'position: fixed; top: 100px; left: 100px; width: 80px; height: 20px' }, () => 'Anchor'),
        h(PopperContent, { 'data-testid': 'content', 'data-state': state.value }, () => `${plain} ${reactive.value}`),
      ]),
    }), { attachTo: document.body })
    await settle()
    const content = document.querySelector<HTMLElement>('[data-testid="content"]')!
    expect(content.textContent).toBe('one a')

    reactive.value = 'b'
    await nextTick()
    expect(content.textContent).toBe('one b')

    plain = 'two'
    tick.value++
    await nextTick()
    expect(content.textContent).toBe('two b')

    state.value = 'open'
    await nextTick()
    expect(content.dataset.state).toBe('open')
  })

  it('should update the content of a compiled template', async () => {
    wrapper = mount(PopperRenders, { props: { label: 'a' }, attachTo: document.body })
    await settle()
    const content = document.querySelector<HTMLElement>('[data-testid="content"]')!
    expect(content.textContent).toBe('a')

    await wrapper.setProps({ label: 'b', show: true })
    expect(content.textContent).toBe('bshown')
    expect(content.dataset.label).toBe('b')
  })
})
