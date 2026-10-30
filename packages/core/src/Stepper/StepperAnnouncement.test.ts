import type { StepperRootProps } from './StepperRoot.vue'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { StepperDescription, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '.'

function setup(values = [0, 1, 2], props: StepperRootProps = {}) {
  const steps = ref(values)
  const current = ref(values[0])
  const rootProps = ref(props)
  const view = render(defineComponent({
    setup: () => () => h(StepperRoot, { modelValue: current.value, linear: false, ...rootProps.value }, () =>
      steps.value.map(step => h(StepperItem, { key: step, step }, () => [
        h(StepperTrigger, () => h(StepperTitle, () => `Step ${step}`)),
        h(StepperDescription, () => `Description ${step}`),
      ]))),
  }))
  return { ...view, steps, current, rootProps }
}

describe('stepper announcements', () => {
  it.each([[0, 1, 2], [1, 2, 3], [10, 20, 30]])('announces the position for values %j', async (...values) => {
    const { getByRole, current } = setup(values)
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Step 1 of 3')
    current.value = values[1]
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Step 2 of 3')
  })

  it('follows DOM order when keyed steps are inserted, reordered and removed', async () => {
    const { getByRole, current, steps } = setup([20, 40, 60])
    current.value = 40
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Step 2 of 3')
    steps.value = [10, 20, 40, 60]
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Step 3 of 4')
    steps.value = [60, 40, 20, 10]
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Step 2 of 4')
    steps.value = [60, 20, 10]
    await nextTick()
    expect(getByRole('status')).toBeEmptyDOMElement()
    steps.value = [40, 60, 20, 10]
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Step 1 of 4')
  })

  it('allows translated announcements and locale changes', async () => {
    const { getByRole, current, rootProps } = setup([0, 1, 2], {
      announce: (step, total) => `${total}단계 중 ${step}단계`,
    })
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('3단계 중 1단계')
    current.value = 1
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('3단계 중 2단계')
    rootProps.value = { announce: (step, total) => `Étape ${step} sur ${total}` }
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Étape 2 sur 3')
  })

  it('allows consumers to disable the built-in live region', async () => {
    const { queryByRole } = setup([0, 1, 2], { announce: false })
    await nextTick()
    expect(queryByRole('status')).toBeNull()
  })

  it('does not announce an absent step or an empty stepper', async () => {
    const { getByRole, current, steps } = setup([0, 1])
    current.value = 99
    await nextTick()
    expect(getByRole('status')).toBeEmptyDOMElement()
    steps.value = []
    await nextTick()
    expect(getByRole('status')).toBeEmptyDOMElement()
  })

  it('keeps the announcement accessible', async () => {
    const { container, getByRole } = setup()
    await nextTick()
    expect(getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(getByRole('status')).toHaveAttribute('aria-atomic', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })
})
