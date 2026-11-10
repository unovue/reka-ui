import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const PLACEHOLDER = 'Pick a fruit'
const FRUITS = ['Apple', 'Banana', 'Cherry']

function mountSelect(defaultValue?: string, position: 'popper' | 'item-aligned' = 'popper') {
  document.body.innerHTML = ''
  const Fixture = defineComponent({
    setup() {
      return () => h(SelectRoot, { defaultValue }, () => [
        h(SelectTrigger, { 'data-testid': 'trigger' }, () => h(SelectValue, { placeholder: PLACEHOLDER })),
        h(SelectPortal, null, () => h(SelectContent, { position }, () => h(SelectViewport, null, () => FRUITS.map(fruit =>
          h(SelectItem, { 'key': fruit, 'value': fruit, 'data-testid': `item-${fruit}` }, () => h(SelectItemText, null, () => fruit)),
        )))),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return {
    trigger: () => document.querySelector<HTMLElement>('[data-testid="trigger"]')!,
    item: (fruit: string) => document.querySelector<HTMLElement>(`[data-testid="item-${fruit}"]`)!,
  }
}

function recordTriggerText(trigger: HTMLElement) {
  const seen: string[] = []
  const push = () => {
    const text = trigger.textContent?.trim() ?? ''
    if (seen.at(-1) !== text)
      seen.push(text)
  }
  push()

  const observer = new MutationObserver(push)
  observer.observe(trigger, { childList: true, subtree: true, characterData: true })

  let frame = requestAnimationFrame(function tick() {
    push()
    frame = requestAnimationFrame(tick)
  })

  return {
    seen,
    stop: () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    },
  }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 100))

const EXIT_ANIMATION_MS = 150

function installExitAnimation() {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes select-test-fade-out { from { opacity: 1 } to { opacity: 0 } }
    [role="listbox"][data-state="closed"] { animation: select-test-fade-out ${EXIT_ANIMATION_MS}ms linear forwards; }
  `
  document.head.append(style)
  return () => style.remove()
}

describe.each(['popper', 'item-aligned'] as const)('given Select with a placeholder and position=%s, in a real browser', (position) => {
  it('never shows the placeholder while the first selection closes the content', async () => {
    const { trigger, item } = mountSelect(undefined, position)
    await userEvent.click(trigger())
    await expect.poll(() => item('Banana')).not.toBeNull()

    const recorder = recordTriggerText(trigger())
    await userEvent.click(item('Banana'))
    await expect.poll(() => document.querySelector('[role="listbox"]')).toBeNull()
    await settle()
    recorder.stop()

    expect(recorder.seen).toEqual([PLACEHOLDER, 'Banana'])
  })

  it('never shows the placeholder while switching from one option to another', async () => {
    const { trigger, item } = mountSelect('Apple', position)
    await userEvent.click(trigger())
    await expect.poll(() => item('Cherry')).not.toBeNull()

    const recorder = recordTriggerText(trigger())
    await userEvent.click(item('Cherry'))
    await expect.poll(() => document.querySelector('[role="listbox"]')).toBeNull()
    await settle()
    recorder.stop()

    expect(recorder.seen).toEqual(['Apple', 'Cherry'])
  })

  describe.runIf(position === 'popper')('with a CSS exit animation on the closed listbox', () => {
    it('plays the exit animation, then unmounts, without showing the placeholder', async () => {
      const removeStyle = installExitAnimation()
      try {
        const { trigger, item } = mountSelect('Apple', position)
        await userEvent.click(trigger())
        await expect.poll(() => item('Cherry')).not.toBeNull()

        const recorder = recordTriggerText(trigger())
        await userEvent.click(item('Cherry'))

        const listbox = () => document.querySelector('[role="listbox"]')
        await expect.poll(() => listbox()?.getAttribute('data-state')).toBe('closed')
        const closedAt = performance.now()
        const names = listbox()!.getAnimations().map(animation => (animation as CSSAnimation).animationName)
        expect(names).toContain('select-test-fade-out')

        await expect.poll(() => listbox()).toBeNull()
        expect(performance.now() - closedAt).toBeGreaterThanOrEqual(EXIT_ANIMATION_MS * 0.8)
        await settle()
        recorder.stop()

        expect(recorder.seen).toEqual(['Apple', 'Cherry'])
      }
      finally {
        removeStyle()
      }
    })
  })
})
