import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '.'

describe('stepper announcements in a real browser', () => {
  it.each(['ltr', 'rtl'] as const)('announces zero-based steps after keyboard selection in %s', async (dir) => {
    const fixture = mount(defineComponent({
      setup: () => () => h(StepperRoot, {
        defaultValue: 0,
        linear: false,
        dir,
        announce: (step, total) => `Étape ${step} sur ${total}`,
      }, () => [0, 1, 2].map(step => h(StepperItem, { step }, () =>
        h(StepperTrigger, { 'data-testid': `step-${step}` }, () => h(StepperTitle, () => `Step ${step}`))))),
    }), { attachTo: document.body })
    try {
      const first = fixture.get('[data-testid="step-0"]').element as HTMLElement
      const second = fixture.get('[data-testid="step-1"]').element as HTMLElement
      await expect.poll(() => fixture.get('[role="status"]').text()).toBe('Étape 1 sur 3')
      await userEvent.click(first)
      await userEvent.keyboard(dir === 'ltr' ? '{ArrowRight}' : '{ArrowLeft}')
      expect(document.activeElement).toBe(second)
      await userEvent.keyboard('{Enter}')
      await expect.poll(() => fixture.get('[role="status"]').text()).toBe('Étape 2 sur 3')
    }
    finally {
      fixture.unmount()
    }
  })
})
