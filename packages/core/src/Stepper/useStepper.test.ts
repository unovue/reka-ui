import type { UseStepperProps, UseStepperReturn } from './useStepper'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, effectScope, h, nextTick, onMounted, ref } from 'vue'
import { StepperItem, StepperRoot, StepperTrigger } from '.'
import { useStepper } from './useStepper'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

/** `useStepper` owns watchers, so run it in a disposable scope. */
function withStepper(props: UseStepperProps = {}, steps = 4): UseStepperReturn {
  const scope = effectScope()
  const stepper = scope.run(() => useStepper(props))!
  // Register `steps` trigger elements, as `StepperTrigger` does on mount.
  for (let i = 0; i < steps; i++)
    stepper.context.totalStepperItems.value.add(document.createElement('button'))
  return stepper
}

describe('useStepper — model', () => {
  it('starts at defaultValue (1 by default), uncontrolled', () => {
    const s = withStepper()
    expect(s.modelValue.value).toBe(1)
    expect(s.isControlled.value).toBe(false)
    expect(s.totalSteps.value).toBe(4)
    expect(s.isFirstStep.value).toBe(true)
    expect(s.lastChangeDetails.value.reason).toBe('none')
    expect(withStepper({ defaultValue: 3 }).modelValue.value).toBe(3)
  })

  it('nextStep / prevStep report their reasons; no emit when unchanged', () => {
    const onUpdate = vi.fn()
    const s = withStepper({ onUpdate })
    expect(s.nextStep()).toBe(true)
    expect(onUpdate).toHaveBeenLastCalledWith(2, expect.objectContaining({ reason: 'next-step' }))
    expect(s.prevStep()).toBe(true)
    expect(onUpdate).toHaveBeenLastCalledWith(1, expect.objectContaining({ reason: 'prev-step' }))
    expect(s.prevStep()).toBe(false)
    expect(s.goToStep(1)).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('goToStep honours linear and the step count', () => {
    const onUpdate = vi.fn()
    const s = withStepper({ onUpdate })
    expect(s.goToStep(3)).toBe(false)
    expect(s.goToStep(5)).toBe(false)
    expect(s.goToStep(2)).toBe(true)
    expect(onUpdate).toHaveBeenLastCalledWith(2, expect.objectContaining({ reason: 'imperative-action' }))

    const free = withStepper({ linear: false })
    expect(free.goToStep(4)).toBe(true)
    expect(free.modelValue.value).toBe(4)
    expect(free.isLastStep.value).toBe(true)
  })

  it('controlled getter + emit: emits beforeUpdate then update, writes nothing', () => {
    const emit = vi.fn()
    const s = withStepper({ modelValue: () => 2, emit })
    expect(s.isControlled.value).toBe(true)
    s.nextStep()
    expect(s.modelValue.value).toBe(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', 3, expect.objectContaining({ reason: 'next-step' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', 3, expect.objectContaining({ reason: 'next-step' }))
  })

  it('ref-owned: writes back to the passed ref', () => {
    const model = ref<number | undefined>(1)
    const s = withStepper({ modelValue: model })
    s.nextStep()
    expect(model.value).toBe(2)
  })

  it('cancel in onBeforeUpdate keeps the step', () => {
    const onUpdate = vi.fn()
    const s = withStepper({ onBeforeUpdate: (_v, details) => details.cancel(), onUpdate })
    expect(s.nextStep()).toBe(false)
    expect(s.modelValue.value).toBe(1)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(s.lastChangeDetails.value.isCanceled).toBe(true)
  })
})

describe('useStepper — trigger reasons', () => {
  it('mousedown reports trigger-press, Enter/Space report trigger-keydown', () => {
    const onUpdate = vi.fn()
    const s = withStepper({ onUpdate, linear: false })
    const press = new MouseEvent('mousedown', { button: 0 })
    s.getItem(3).trigger.props.value.onMousedown(press)
    expect(onUpdate).toHaveBeenLastCalledWith(3, expect.objectContaining({ reason: 'trigger-press', event: press }))

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    s.getItem(2).trigger.props.value.onKeydown(enter)
    expect(onUpdate).toHaveBeenLastCalledWith(2, expect.objectContaining({ reason: 'trigger-keydown', event: enter }))
    expect(enter.defaultPrevented).toBe(true)

    s.getItem(4).trigger.props.value.onKeydown(new KeyboardEvent('keydown', { key: ' ' }))
    expect(onUpdate).toHaveBeenLastCalledWith(4, expect.objectContaining({ reason: 'trigger-keydown' }))
  })

  it('a linear stepper blocks a press beyond the next step and prevents focus', () => {
    const onUpdate = vi.fn()
    const s = withStepper({ onUpdate })
    const press = new MouseEvent('mousedown', { button: 0, cancelable: true })
    s.getItem(3).trigger.props.value.onMousedown(press)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(press.defaultPrevented).toBe(true)
  })

  it('ignores right clicks, unrelated keys and disabled steps', () => {
    const onUpdate = vi.fn()
    const s = withStepper({ onUpdate, linear: false })
    s.getItem(2).trigger.props.value.onMousedown(new MouseEvent('mousedown', { button: 2 }))
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true })
    s.getItem(2).trigger.props.value.onKeydown(tab)
    expect(tab.defaultPrevented).toBe(false)
    s.getItem(2, { disabled: true }).trigger.props.value.onMousedown(new MouseEvent('mousedown', { button: 0 }))
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('useStepper — surfaces', () => {
  it('root is role="group" with data-linear/data-orientation from state', () => {
    const s = withStepper()
    expect(noDataAttrs(s.root.props.value)).toBe(true)
    expect(s.root.attrs.value).toMatchObject({ 'role': 'group', 'aria-label': 'progress', 'data-linear': '', 'data-orientation': 'horizontal' })
  })

  it('items report completed / current / upcoming and linear focusability', () => {
    const s = withStepper({ defaultValue: 2 })
    expect(s.getItem(1).item.attrs.value).toMatchObject({ 'data-state': 'completed' })
    expect(s.getItem(2).item.attrs.value).toMatchObject({ 'data-state': 'current', 'aria-current': 'true' })
    const upcoming = s.getItem(3)
    expect(upcoming.item.attrs.value['data-state']).toBe('upcoming')
    expect(upcoming.trigger.attrs.value.tabindex).toBe(0)
    const blocked = s.getItem(4)
    expect(blocked.trigger.attrs.value).toMatchObject({ 'tabindex': -1, 'disabled': '', 'data-disabled': '' })
    expect(s.getItem(4, { completed: true }).item.state.value.state).toBe('completed')
  })

  it('title / description ids derive from baseId and wire the trigger', () => {
    const s = withStepper({ baseId: 'checkout' })
    const step = s.getItem(2)
    expect(step.title.attrs.value).toEqual({ id: 'checkout-item-2-title' })
    expect(step.description.attrs.value).toEqual({ id: 'checkout-item-2-description' })
    expect(step.trigger.attrs.value).toMatchObject({ 'aria-labelledby': 'checkout-item-2-title', 'aria-describedby': 'checkout-item-2-description' })
  })
})

describe('useStepper — standalone render', () => {
  const Standalone = defineComponent({
    setup() {
      const s = useStepper({ baseId: 'standalone' })
      const steps = [1, 2, 3].map(step => ({ step, parts: s.getItem(step) }))
      const triggers = ref<HTMLElement[]>([])
      onMounted(() => triggers.value.forEach(el => s.context.totalStepperItems.value.add(el)))
      return () => h('div', s.root.attrs.value, steps.map(({ step, parts }) =>
        h('div', { key: step, ...parts.item.attrs.value }, [
          h('button', {
            'type': 'button',
            'ref': (el: any) => {
              if (el && !triggers.value.includes(el))
                triggers.value.push(el)
            },
            'data-testid': `trigger-${step}`,
            ...parts.trigger.attrs.value,
          }, [
            h('span', parts.title.attrs.value, `Step ${step}`),
            h('span', parts.description.attrs.value, `Description ${step}`),
          ]),
        ])))
    },
  })

  it('renders, selects a step and passes axe', async () => {
    const { container, getByTestId } = render(Standalone)
    await nextTick()
    await fireEvent.mouseDown(getByTestId('trigger-2'))
    expect(getByTestId('trigger-2')).toHaveAttribute('data-state', 'current')
    expect(getByTestId('trigger-1')).toHaveAttribute('data-state', 'completed')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('stepperRoot — details contract', () => {
  function mountRoot(props: Record<string, any>) {
    return render(defineComponent({
      setup: () => () => h(StepperRoot, props, () => [1, 2, 3].map(step =>
        h(StepperItem, { key: step, step }, () => h(StepperTrigger, { 'data-testid': `trigger-${step}` }, () => `Step ${step}`)))),
    }))
  }

  it('emits update:modelValue with details', async () => {
    const onUpdate = vi.fn()
    const { getByTestId } = mountRoot({ 'onUpdate:modelValue': onUpdate })
    await fireEvent.mouseDown(getByTestId('trigger-1'))
    expect(onUpdate).not.toHaveBeenCalled()
    await fireEvent.mouseDown(getByTestId('trigger-2'))
    expect(onUpdate).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'trigger-press' }))
  })

  it('beforeUpdate:modelValue can cancel', async () => {
    const onUpdate = vi.fn()
    const { getByTestId } = mountRoot({
      'onBeforeUpdate:modelValue': (_v: number, details: any) => details.cancel(),
      'onUpdate:modelValue': onUpdate,
    })
    await fireEvent.mouseDown(getByTestId('trigger-2'))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(getByTestId('trigger-1')).toHaveAttribute('data-state', 'current')
  })

  it('controlled: stays on the bound step until the parent updates it', async () => {
    const onUpdate = vi.fn()
    const { getByTestId } = mountRoot({ 'modelValue': 1, 'onUpdate:modelValue': onUpdate })
    await fireEvent.mouseDown(getByTestId('trigger-2'))
    expect(onUpdate).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'trigger-press' }))
    expect(getByTestId('trigger-1')).toHaveAttribute('data-state', 'current')
  })
})
