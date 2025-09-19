import type { StepperRootProps } from './StepperRoot.vue'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import Stepper from './story/_Stepper.vue'

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
})
