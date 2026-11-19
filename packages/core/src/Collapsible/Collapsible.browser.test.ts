import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '.'

// Browsers restart a CSS animation whenever its element is inserted into the document again,
// which is what Vue does to a keyed item that moves. jsdom runs no animations at all.
//
// The animations and the transition last a minute, so one is still running whenever a test
// gets to look at it, however busy the machine is. A test ends one with `finish()`.
const css = `
@keyframes reka-test-open { from { opacity: 0 } to { opacity: 1 } }
@keyframes reka-test-close { from { opacity: 1 } to { opacity: 0 } }
.content[data-state="open"] { animation: reka-test-open 60s linear }
.content[data-state="closed"] { animation: reka-test-close 60s linear }
.content.with-paused[data-state="open"] { animation: reka-test-open 60s linear, reka-test-close 1s linear infinite paused }
.with-transition { transition: background-color 60s linear }
.with-transition.tinted { background-color: rgb(255, 0, 0) }
`

let style: HTMLStyleElement | undefined

afterEach(() => {
  style?.remove()
})

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

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
  const wrapper = mount(Fixture, { attachTo: document.body })

  // Every CSS animation that started in the list, in order.
  const started: string[] = []
  wrapper.element.addEventListener('animationstart', event => started.push((event as AnimationEvent).animationName))

  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const running = (id: string) => get(id).getAnimations().filter(a => a.playState === 'running')
  // A transition has no `animationName`, and comes first in `getAnimations()`.
  const runningAnimations = (id: string) => running(id).map(a => (a as CSSAnimation).animationName)

  /**
   * Ends the running animation called `name`, or the running transition without one, and
   * waits until the browser has dispatched its end event, which the content acts on.
   */
  const finish = (id: string, name?: string) => new Promise<void>((resolve) => {
    const animation = running(id).find(a => (a as CSSAnimation).animationName === name)!
    const type = name ? 'animationend' : 'transitionend'
    const onEnd = (event: Event) => {
      if (event.target !== get(id) || (event as AnimationEvent).animationName !== name)
        return
      get(id).removeEventListener(type, onEnd)
      resolve()
    }
    get(id).addEventListener(type, onEnd)
    animation.finish()
  })

  /**
   * Lets the content finish what it does in the frame after an animation ended. The content
   * asked for that frame before the test asks for this one, so no margin is involved.
   */
  const settle = async () => {
    await nextFrame()
    await nextFrame()
  }

  // [a, b, c] -> [b, c, a]: the longest kept run is b, c, so Vue moves a's DOM node.
  const moveFirstToEnd = async () => {
    items.value = [...items.value.slice(1), items.value[0]]
    await nextTick()
    expect(get('content-c').compareDocumentPosition(get('content-a')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  }

  /** Expects that nothing started to animate in the two frames after `action`. */
  const expectNoReplay = async (action: () => Promise<void>) => {
    const startedBefore = [...started]
    await action()
    expect(runningAnimations('content-a')).toEqual([])
    await settle()
    expect(runningAnimations('content-a')).toEqual([])
    expect(started).toEqual(startedBefore)
  }

  return { get, started, runningAnimations, finish, settle, moveFirstToEnd, expectNoReplay }
}

describe('given a list of Collapsibles with CSS keyframe animations, in a real browser', () => {
  it('does not replay the open animation when an opened item is moved', async () => {
    const { get, started, runningAnimations, finish, settle, moveFirstToEnd, expectNoReplay } = mountList()

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-open'])
    await finish('content-a', 'reka-test-open')
    await settle()

    await expectNoReplay(moveFirstToEnd)
    expect(started).toEqual(['reka-test-open'])
    expect(get('content-a').getAttribute('data-state')).toBe('open')
  })

  it('does not replay the open animation when a transition outlasted it', async () => {
    const { get, runningAnimations, finish, settle, moveFirstToEnd, expectNoReplay } = mountList(false, 'content with-transition')

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-open'])
    // An unrelated transition (a hover style, say) starts during the open animation.
    get('content-a').classList.add('tinted')
    expect(runningAnimations('content-a')).toEqual([undefined, 'reka-test-open'])
    // The background transition is still running when the open animation ends.
    await finish('content-a', 'reka-test-open')
    expect(runningAnimations('content-a')).toEqual([undefined])
    await finish('content-a')
    expect(runningAnimations('content-a')).toEqual([])
    await settle()

    await expectNoReplay(moveFirstToEnd)
  })

  it('keeps a paused animation applied after the open animation ends', async () => {
    const { get, finish, settle } = mountList(false, 'content with-paused')
    const states = () => get('content-a').getAnimations().map(a => `${(a as CSSAnimation).animationName}:${a.playState}`)

    await userEvent.click(get('trigger-a'))
    await expect.poll(states).toEqual(['reka-test-open:running', 'reka-test-close:paused'])
    await finish('content-a', 'reka-test-open')
    expect(states()).toEqual(['reka-test-close:paused'])
    await settle()

    expect(states()).toEqual(['reka-test-close:paused'])
  })

  it('still animates the next close and open after a move', async () => {
    const { get, runningAnimations, finish, settle, moveFirstToEnd } = mountList()

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-open'])
    await finish('content-a', 'reka-test-open')
    await settle()
    await moveFirstToEnd()

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-close'])
    await finish('content-a', 'reka-test-close')
    await expect.poll(() => get('content-a').hasAttribute('hidden')).toBe(true)

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-open'])
  })

  it('does not replay the close animation when a closed item is moved after closing', async () => {
    const { get, started, runningAnimations, finish, settle, moveFirstToEnd, expectNoReplay } = mountList(true)

    await userEvent.click(get('trigger-a'))
    await expect.poll(() => runningAnimations('content-a')).toEqual(['reka-test-close'])
    await finish('content-a', 'reka-test-close')
    await expect.poll(() => get('content-a').hasAttribute('hidden')).toBe(true)
    await settle()

    await expectNoReplay(moveFirstToEnd)
    expect(started).toEqual(['reka-test-close'])
  })

  it('does not replay the open animation of an initially open item that is moved', async () => {
    const { started, settle, moveFirstToEnd, expectNoReplay } = mountList(true)
    await settle()

    await expectNoReplay(moveFirstToEnd)
    expect(started).toEqual([])
  })
})
