import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '.'

// Browsers restart a CSS animation whenever its element is inserted into the document again,
// which is what Vue does to a keyed item that moves. jsdom runs no animations at all.
const css = `
@keyframes reka-test-open { from { opacity: 0 } to { opacity: 1 } }
@keyframes reka-test-close { from { opacity: 1 } to { opacity: 0 } }
.content[data-state="open"] { animation: reka-test-open 100ms linear }
.content[data-state="closed"] { animation: reka-test-close 100ms linear }
.with-transition { transition: background-color 300ms linear }
.with-transition.tinted { background-color: rgb(255, 0, 0) }
`

let style: HTMLStyleElement | undefined

afterEach(() => {
  style?.remove()
})

function mountList(defaultOpen = false, contentClass = 'content') {
  document.body.innerHTML = ''
  style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  const items = ref(['a', 'b', 'c'])
  const Fixture = defineComponent({
    setup() {
      return () => h('div', items.value.map(item =>
        h(CollapsibleRoot, { key: item, defaultOpen }, () => [
          h(CollapsibleTrigger, { 'data-testid': `trigger-${item}` }, () => item),
          h(CollapsibleContent, { 'class': contentClass, 'data-testid': `content-${item}` }, () => `Content ${item}`),
        ]),
      ))
    },
  })
  mount(Fixture, { attachTo: document.body })

  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const runningAnimations = (id: string) => get(id).getAnimations().filter(a => a.playState === 'running').map(a => (a as CSSAnimation).animationName)
  // [a, b, c] -> [b, c, a]: the longest kept run is b, c, so Vue moves a's DOM node.
  const moveFirstToEnd = async () => {
    items.value = [...items.value.slice(1), items.value[0]]
    await nextTick()
  }
  return { get, runningAnimations, moveFirstToEnd }
}

describe('given a list of Collapsibles with CSS keyframe animations, in a real browser', () => {
  it('does not replay the open animation when an opened item is moved', async () => {
    const { get, runningAnimations, moveFirstToEnd } = mountList()

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-open'])
    await expect.poll(() => runningAnimations('content-a')).toEqual([])
    // Let the post-animation cleanup frame run.
    await new Promise(resolve => requestAnimationFrame(resolve))
    await new Promise(resolve => requestAnimationFrame(resolve))

    await moveFirstToEnd()
    expect(document.querySelector('[data-testid="content-c"]')!.compareDocumentPosition(get('content-a')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(runningAnimations('content-a')).toEqual([])
    expect(get('content-a').getAttribute('data-state')).toBe('open')
  })

  it('does not replay the open animation when a transition outlasted it', async () => {
    const { get, runningAnimations, moveFirstToEnd } = mountList(false, 'content with-transition')
    const running = (id: string) => get(id).getAnimations().filter(a => a.playState === 'running')

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-open'])
    // An unrelated transition (a hover style, say) starts during the open animation.
    get('content-a').classList.add('tinted')
    // Transitions come first in `getAnimations()` and have no `animationName`.
    expect(runningAnimations('content-a')).toEqual([undefined, 'reka-test-open'])
    // The 300ms background transition is still running when the 100ms animation ends.
    await expect.poll(() => runningAnimations('content-a')).toEqual([undefined])
    await expect.poll(() => running('content-a')).toEqual([])
    await new Promise(resolve => requestAnimationFrame(resolve))

    await moveFirstToEnd()
    expect(runningAnimations('content-a')).toEqual([])
  })

  it('still animates the next close and open after a move', async () => {
    const { get, runningAnimations, moveFirstToEnd } = mountList()

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual([])
    await new Promise(resolve => requestAnimationFrame(resolve))
    await new Promise(resolve => requestAnimationFrame(resolve))
    await moveFirstToEnd()

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-close'])
    await expect.poll(() => get('content-a').hasAttribute('hidden')).toBe(true)

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-open'])
  })

  it('does not replay the close animation when a closed item is moved after closing', async () => {
    const { get, runningAnimations, moveFirstToEnd } = mountList(true)

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-close'])
    await expect.poll(() => get('content-a').hasAttribute('hidden')).toBe(true)
    await new Promise(resolve => requestAnimationFrame(resolve))
    await new Promise(resolve => requestAnimationFrame(resolve))

    await moveFirstToEnd()
    expect(runningAnimations('content-a')).toEqual([])
  })

  it('does not replay the open animation of an initially open item that is moved', async () => {
    const { get, runningAnimations, moveFirstToEnd } = mountList(true)
    await new Promise(resolve => requestAnimationFrame(resolve))
    await new Promise(resolve => requestAnimationFrame(resolve))

    await moveFirstToEnd()
    expect(runningAnimations('content-a')).toEqual([])
  })
})
