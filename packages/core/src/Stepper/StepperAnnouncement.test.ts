import type { StepperRootProps } from './StepperRoot.vue'
import { render, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { StepperDescription, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '.'

function setup(values = [0, 1, 2], props: StepperRootProps = {}, options: { nested?: boolean, asChild?: boolean } = {}) {
  const steps = ref(values)
  const current = ref(values[0])
  const rootProps = ref(props)
  const triggerTag = ref('button')
  const renderSteps = () => steps.value.map(step => h(StepperItem, { key: step, step }, () => [
    h(StepperTrigger, options.asChild ? { asChild: true } : { as: triggerTag.value }, () =>
      options.asChild
        ? h(triggerTag.value, null, [h(StepperTitle, () => `Step ${step}`)])
        : h(StepperTitle, () => `Step ${step}`)),
    h(StepperDescription, () => `Description ${step}`),
  ]))
  const NestedSteps = defineComponent({ setup: () => renderSteps })
  const view = render(defineComponent({
    setup: () => () => h(StepperRoot, { modelValue: current.value, linear: false, ...rootProps.value }, () =>
      options.nested ? h(NestedSteps) : renderSteps()),
  }))
  return { ...view, steps, current, rootProps, triggerTag }
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
    await waitFor(() => expect(getByRole('status')).toHaveTextContent('Step 2 of 4'))
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

  it('updates the position when a nested component reorders its steps', async () => {
    const { getByRole, current, steps } = setup([10, 20, 30], {}, { nested: true })
    current.value = 20
    await nextTick()
    expect(getByRole('status')).toHaveTextContent('Step 2 of 3')
    steps.value = [30, 10, 20]
    await waitFor(() => expect(getByRole('status')).toHaveTextContent('Step 3 of 3'))
  })

  it.each([false, true])('keeps the order correct after replacing trigger elements (asChild: %s)', async (asChild) => {
    const { getByRole, current, steps, triggerTag } = setup([10, 20, 30], {}, { asChild })
    current.value = 20
    await nextTick()
    triggerTag.value = 'a'
    await nextTick()
    steps.value = [30, 10, 20]
    await waitFor(() => expect(getByRole('status')).toHaveTextContent('Step 3 of 3'))
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
