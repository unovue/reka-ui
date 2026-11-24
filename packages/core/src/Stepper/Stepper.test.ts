import type { StepperRootProps } from './StepperRoot.vue'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import { useTestKbd } from '@/shared'
import { StepperDescription, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '.'
import Stepper from './story/_Stepper.vue'
import StepperDynamic from './story/_StepperDynamic.vue'

const steps = [{
  step: 1,
  title: 'Address',
  description: 'Add your address here',
  icon: 'radix-icons:home',
}, {
  step: 2,
  title: 'Shipping',
  description: 'Set your preferred shipping method',
  icon: 'radix-icons:archive',
}, {
  step: 3,
  title: 'Trade-in',
  description: 'Add any trade-in items you have',
  icon: 'radix-icons:update',
}, {
  step: 4,
  title: 'Payment',
  description: 'Add any payment information you have',
  icon: 'radix-icons:sketch-logo',
}, {
  step: 5,
  title: 'Checkout',
  description: 'Confirm your order',
  icon: 'radix-icons:check',
}]

const kbd = useTestKbd()

function setup(props: { stepperProps?: StepperRootProps & { steps: { step: number, title: string, description: string, icon: string, isCompleted?: boolean }[] }, emits?: { 'onUpdate:modelValue'?: (data: number) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(Stepper, { props })
  const stepper = returned.getByTestId('stepper')
  expect(stepper).toBeVisible()
  return { ...returned, user, stepper }
}

it('should pass axe accessibility tests', async () => {
  const { stepper } = setup()
  expect(await axe(stepper)).toHaveNoViolations()
})

describe('stepper', async () => {
  it('respects a default value if provided', async () => {
    const { getByTestId } = setup({ stepperProps: { modelValue: 2, steps } })
    expect(getByTestId('stepper-item-2')).toHaveAttribute('aria-current', 'true')
  })

  it('navigates horizontally using the keyboard', async () => {
    const { getByTestId, user } = setup({ stepperProps: { steps } })

    const firstItem = getByTestId('stepper-item-trigger-1')
    const lastItem = getByTestId('stepper-item-trigger-2')

    await user.click(firstItem)
    expect(firstItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(lastItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_LEFT)
    expect(firstItem).toHaveFocus()
  })

  it('navigates vertically using the keyboard', async () => {
    const { getByTestId, user } = setup({ stepperProps: { steps, orientation: 'vertical' } })

    const firstItem = getByTestId('stepper-item-trigger-1')
    const lastItem = getByTestId('stepper-item-trigger-2')

    await user.click(firstItem)
    expect(firstItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_DOWN)
    expect(lastItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_UP)
    expect(firstItem).toHaveFocus()
  })

  it('prevents navigation to other elements if linear is true', async () => {
    const { getByTestId, user } = setup({ stepperProps: { steps, linear: true } })

    const firstItem = getByTestId('stepper-item-trigger-1')
    const secondItem = getByTestId('stepper-item-trigger-2')
    const thirdItem = getByTestId('stepper-item-trigger-3')

    await user.click(firstItem)
    expect(firstItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(secondItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(thirdItem).not.toHaveFocus()

    await user.click(thirdItem)
    expect(thirdItem).not.toHaveFocus()
  })

  it('allows navigation to other elements if linear is false', async () => {
    const { getByTestId, user } = setup({ stepperProps: { steps, linear: false } })

    const firstItem = getByTestId('stepper-item-trigger-1')
    const secondItem = getByTestId('stepper-item-trigger-2')
    const thirdItem = getByTestId('stepper-item-trigger-3')
    const fourthItem = getByTestId('stepper-item-trigger-4')

    await user.click(firstItem)
    expect(firstItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(secondItem).toHaveFocus()

    await user.keyboard(kbd.ARROW_RIGHT)
    expect(thirdItem).toHaveFocus()

    await user.click(fourthItem)
    expect(fourthItem).toHaveFocus()
  })

  it('selects a step on click', async () => {
    const { getByTestId, user } = setup({ stepperProps: { steps } })

    const secondItem = getByTestId('stepper-item-trigger-2')

    await user.click(secondItem)
    expect(getByTestId('stepper-item-2')).toHaveAttribute('aria-current', 'true')
  })

  it.each([kbd.ENTER, kbd.SPACE])('selects a step using the %s key', async (key) => {
    const { getByTestId, user } = setup({ stepperProps: { steps } })

    const firstItem = getByTestId('stepper-item-trigger-1')
    const secondItem = getByTestId('stepper-item-2')
    const thirdItem = getByTestId('stepper-item-3')

    await user.click(firstItem)
    await user.keyboard(kbd.ARROW_RIGHT)

    await user.keyboard(key)
    expect(secondItem).toHaveAttribute('aria-current', 'true')
    await user.keyboard(kbd.ARROW_RIGHT)

    await user.keyboard(key)
    expect(thirdItem).toHaveAttribute('aria-current', 'true')
  })

  it('enables the next step for linear steppers', async () => {
    const { getByTestId, user } = setup({ stepperProps: { steps, linear: true } })

    const secondItem = getByTestId('stepper-item-trigger-2')
    const thirdItem = getByTestId('stepper-item-trigger-3')

    await user.click(secondItem)
    expect(getByTestId('stepper-item-2')).toHaveAttribute('aria-current', 'true')
    expect(getByTestId('stepper-item-3')).not.toHaveAttribute('data-disabled', '')

    await user.click(thirdItem)
    expect(getByTestId('stepper-item-3')).toHaveAttribute('aria-current', 'true')
    expect(getByTestId('stepper-item-4')).not.toHaveAttribute('data-disabled', '')
  })

  it('keeps the total step count in sync when triggers unmount and remount', async () => {
    const { getByTestId, rerender } = render(StepperDynamic, { props: { visibleSteps: 5 } })
    const totalSteps = getByTestId('total-steps')
    await nextTick()
    expect(totalSteps).toHaveTextContent('5')

    // unmount two triggers
    await rerender({ visibleSteps: 3 })
    await nextTick()
    expect(totalSteps).toHaveTextContent('3')

    // remount them: count must not drift upwards
    await rerender({ visibleSteps: 5 })
    await nextTick()
    expect(totalSteps).toHaveTextContent('5')

    // repeated toggling must stay stable (regression: Set leaked stale elements)
    await rerender({ visibleSteps: 1 })
    await nextTick()
    expect(totalSteps).toHaveTextContent('1')

    await rerender({ visibleSteps: 5 })
    await nextTick()
    expect(totalSteps).toHaveTextContent('5')
  })
})

const parts = { StepperRoot, StepperItem, StepperTrigger, StepperTitle, StepperDescription }

describe('stepper trigger accessibility', () => {
  it('names the trigger by its title and description', async () => {
    const { getByTestId, getByRole } = setup({ stepperProps: { steps } })
    await nextTick()
    const trigger = getByTestId('stepper-item-trigger-1')
    const titleId = getByTestId('stepper-item-title-1').id
    const descriptionId = getByTestId('stepper-item-description-1').id

    expect(trigger).toHaveAttribute('aria-labelledby', `${titleId} ${descriptionId}`)
    expect(trigger).not.toHaveAttribute('aria-describedby')
    expect(trigger).toHaveAccessibleName('Address Add your address here')
    expect(getByRole('button', { name: 'Address Add your address here' })).toBe(trigger)
    // axe's `label-content-name-mismatch` cannot be evaluated here: jsdom has no layout, so the
    // rule sees no visible text and passes either way. The name assertions above cover it.
  })

  it('only references the parts that are rendered', async () => {
    const { getByTestId } = render(defineComponent({
      components: parts,
      template: `
        <StepperRoot :default-value="1">
          <StepperItem :step="1">
            <StepperTrigger data-testid="title-only"><StepperTitle>Title</StepperTitle></StepperTrigger>
          </StepperItem>
          <StepperItem :step="2">
            <StepperTrigger data-testid="description-only"><StepperDescription>Desc</StepperDescription></StepperTrigger>
          </StepperItem>
          <StepperItem :step="3">
            <StepperTrigger data-testid="bare">3</StepperTrigger>
          </StepperItem>
        </StepperRoot>`,
    }))
    await nextTick()

    const titleOnly = getByTestId('title-only')
    expect(titleOnly.getAttribute('aria-labelledby')).not.toContain(' ')
    expect(titleOnly).not.toHaveAttribute('aria-describedby')
    expect(titleOnly).toHaveAccessibleName('Title')

    const descriptionOnly = getByTestId('description-only')
    expect(descriptionOnly).not.toHaveAttribute('aria-describedby')
    expect(descriptionOnly).toHaveAccessibleName('Desc')

    const bare = getByTestId('bare')
    expect(bare).not.toHaveAttribute('aria-labelledby')
    expect(bare).not.toHaveAttribute('aria-describedby')
    expect(bare).toHaveAccessibleName('3')
  })

  it('lets a consumer aria-label name the trigger', async () => {
    const { getByTestId } = render(defineComponent({
      components: parts,
      template: `
        <StepperRoot :default-value="1">
          <StepperItem :step="1">
            <StepperTrigger data-testid="trigger" aria-label="First step">
              <StepperTitle>Title</StepperTitle>
              <StepperDescription>Desc</StepperDescription>
            </StepperTrigger>
          </StepperItem>
        </StepperRoot>`,
    }))
    await nextTick()

    const trigger = getByTestId('trigger')
    expect(trigger).not.toHaveAttribute('aria-labelledby')
    expect(trigger).toHaveAccessibleName('First step')
    expect(trigger).toHaveAccessibleDescription('Desc')
  })

  it('marks only the current step trigger with aria-current="step"', async () => {
    const { getByTestId, user } = setup({ stepperProps: { steps, defaultValue: 2 } })

    for (const { step } of steps) {
      const trigger = getByTestId(`stepper-item-trigger-${step}`)
      if (step === 2)
        expect(trigger).toHaveAttribute('aria-current', 'step')
      else
        expect(trigger).not.toHaveAttribute('aria-current')
    }
    // kept on the item for backward compatibility
    expect(getByTestId('stepper-item-2')).toHaveAttribute('aria-current', 'true')

    await user.click(getByTestId('stepper-item-trigger-3'))
    expect(getByTestId('stepper-item-trigger-3')).toHaveAttribute('aria-current', 'step')
    expect(getByTestId('stepper-item-trigger-2')).not.toHaveAttribute('aria-current')
  })

  it('keeps the description when a consumer aria-labelledby names the trigger', async () => {
    const { getByTestId } = render(defineComponent({
      components: parts,
      template: `
        <span id="external">External</span>
        <StepperRoot :default-value="1">
          <StepperItem :step="1">
            <StepperTrigger data-testid="trigger" aria-labelledby="external">
              <StepperTitle>Title</StepperTitle>
              <StepperDescription>Desc</StepperDescription>
            </StepperTrigger>
          </StepperItem>
        </StepperRoot>`,
    }))
    await nextTick()

    const trigger = getByTestId('trigger')
    expect(trigger).toHaveAttribute('aria-labelledby', 'external')
    expect(trigger).toHaveAccessibleName('External')
    expect(trigger).toHaveAccessibleDescription('Desc')
  })

  it('marks the current step even when it is completed', async () => {
    const { getByTestId } = render(defineComponent({
      components: parts,
      template: `
        <StepperRoot :model-value="2">
          <StepperItem :step="1" data-testid="item-1">
            <StepperTrigger data-testid="trigger-1">1</StepperTrigger>
          </StepperItem>
          <StepperItem :step="2" completed data-testid="item-2">
            <StepperTrigger data-testid="trigger-2">2</StepperTrigger>
          </StepperItem>
        </StepperRoot>`,
    }))
    await nextTick()

    expect(getByTestId('trigger-2')).toHaveAttribute('aria-current', 'step')
    expect(getByTestId('item-2')).toHaveAttribute('aria-current', 'true')
    expect(getByTestId('item-2')).toHaveAttribute('data-state', 'completed')
    expect(getByTestId('trigger-1')).not.toHaveAttribute('aria-current')
    expect(getByTestId('item-1')).not.toHaveAttribute('aria-current')
  })
})
