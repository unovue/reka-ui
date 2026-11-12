import type { RequiredFamily } from '@/test/hiddenNativeFamilies'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { cdp, userEvent } from 'vitest/browser'
import { h } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { SelectContent, SelectItem, SelectItemText, SelectRoot, SelectTrigger, SelectValue } from '@/Select'
import { hiddenNativeFamilies, twinNames, twinsOf } from '@/test/hiddenNativeFamilies'

/**
 * Mount required named controls backed by hidden native twins.
 *
 * @param initiallyFilled Whether both controls start with valid values.
 * @returns The rendered form for native submission and validity assertions.
 */
function mountForm(initiallyFilled = false) {
  const wrapper = mount(() => h('form', [
    h(SelectRoot, { name: 'topic', required: true, defaultValue: initiallyFilled ? 'news' : undefined }, () => [
      h(SelectTrigger, { 'aria-label': 'Topic' }, () => h(SelectValue)),
      h(SelectContent, null, () => h(SelectItem, { value: 'news' }, () => h(SelectItemText, null, () => 'News'))),
    ]),
    h(CheckboxRoot, { 'name': 'agree', 'required': true, 'defaultValue': initiallyFilled, 'aria-label': 'Accept terms' }),
  ]), { attachTo: document.body })

  return wrapper.element as HTMLFormElement
}

describe('labelled hidden native controls in a real browser', () => {
  it('submits the selected value and checked state', async () => {
    const form = mountForm(true)
    await expect.poll(() => form.querySelector('select option[value="news"]')).not.toBeNull()

    expect(form.checkValidity()).toBe(true)
    expect([...new FormData(form)]).toEqual([['topic', 'news'], ['agree', 'on']])
    expect(form.querySelector('select')?.getAttribute('aria-label')).toBe('topic')
    expect(form.querySelector('input')?.getAttribute('aria-label')).toBe('agree')
  })

  it('keeps native required validation and select autofill working', async () => {
    const form = mountForm()
    await expect.poll(() => form.querySelector('select option[value="news"]')).not.toBeNull()

    const select = form.querySelector('select')!
    const checkbox = form.querySelector('input')!
    expect(select.validity.valueMissing).toBe(true)
    expect(checkbox.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)

    select.value = 'news'
    select.dispatchEvent(new Event('input', { bubbles: true }))
    await expect.poll(() => form.querySelector('[role="combobox"]')?.textContent).toBe('News')
    expect(form.checkValidity()).toBe(false)

    await userEvent.click(form.querySelector<HTMLElement>('[role="checkbox"]')!)

    expect(form.checkValidity()).toBe(true)
    expect([...new FormData(form)]).toEqual([['topic', 'news'], ['agree', 'on']])
  })
})

/**
 * Mount one of each family that renders a hidden native twin.
 *
 * @param required The single family that is required and empty, to fail native validation.
 * @returns The rendered form, once every twin is mounted.
 */
async function mountFamilies(required?: RequiredFamily) {
  const wrapper = mount(hiddenNativeFamilies(required), { attachTo: document.body })

  const form = wrapper.element as HTMLFormElement
  await expect.poll(() => twinsOf(form).length).toBe(twinNames.length)
  return form
}

/** Put the twins back in the state they had before they were labelled. */
function removeLabels(form: HTMLFormElement) {
  twinsOf(form).forEach(twin => twin.removeAttribute('aria-label'))
}

const send = (method: string, params: Record<string, unknown> = {}) => (cdp() as any).send(method, params)

/**
 * Read what Chromium exposes to assistive technology in the test frame.
 *
 * @returns The role, name and focus state of every node that is not ignored.
 */
async function accessibilityTree() {
  const { frameTree } = await send('Page.getFrameTree')
  const frameIds: string[] = []
  const collect = (node: any) => {
    frameIds.push(node.frame.id)
    node.childFrames?.forEach(collect)
  }
  collect(frameTree)

  for (const frameId of frameIds) {
    const { nodes } = await send('Accessibility.getFullAXTree', { frameId })
    const exposed = (nodes as any[]).filter(node => !node.ignored).map(node => ({
      role: (node.role?.value ?? '') as string,
      name: (node.name?.value ?? '') as string,
      focused: (node.properties ?? []).some((property: any) => property.name === 'focused' && property.value.value === true),
    }))
    // The tests run in an iframe: it is the frame that holds the form's submit button.
    if (exposed.some(node => node.role === 'button' && node.name === 'Send'))
      return exposed
  }
  throw new Error('The test frame was not found')
}

describe('every family with a hidden native twin, in a real browser', () => {
  it('labels each twin with its own form field name', async () => {
    const form = await mountFamilies()

    expect(twinsOf(form).map(twin => [twin.name, twin.getAttribute('aria-label')])).toEqual(twinNames.map(name => [name, name]))
    expect(new Set(twinsOf(form).map(twin => twin.getAttribute('tabindex')))).toEqual(new Set(['-1']))
  })

  it('exposes the same accessibility tree at rest as without the labels', async () => {
    const form = await mountFamilies()

    const labelled = await accessibilityTree()
    removeLabels(form)
    const unlabelled = await accessibilityTree()

    expect(labelled).toEqual(unlabelled)
    expect(labelled.filter(node => node.name.startsWith('field-'))).toEqual([])
    expect(labelled.map(node => node.name)).toEqual(expect.arrayContaining([
      'pin input 1 of 2',
      'Accept terms',
      'Topic',
      'Notifications',
      'Minimum price',
      'Maximum price',
      'Send',
    ]))
  })

  describe('when a required field fails native validation on submit', () => {
    async function submit(required: RequiredFamily, labelled: boolean) {
      const form = await mountFamilies(required)
      if (!labelled)
        removeLabels(form)
      const twin = form.querySelector<HTMLInputElement>(`[name="field-${required}"]`)!
      const invalid: Element[] = []
      form.addEventListener('invalid', event => invalid.push(event.target as Element), true)

      await userEvent.click(form.querySelector('button[type="submit"]')!)

      const focused = document.activeElement
      return {
        form,
        twin,
        invalid,
        message: twin.validationMessage,
        // The twin itself, or the visible part it hands focus to.
        focus: focused === twin ? 'twin' : focused?.getAttribute('aria-label'),
      }
    }

    it('focuses the checkbox twin, which is exposed with its field name', async () => {
      const { twin, invalid, focus } = await submit('agree', true)

      expect(invalid).toEqual([twin])
      expect(focus).toBe('twin')
      expect((await accessibilityTree()).filter(node => node.focused && node.role !== 'RootWebArea')).toEqual([
        { role: 'checkbox', name: 'field-agree', focused: true },
      ])
    })

    it.each(['otp', 'birthday', 'alarm', 'agree'] as const)('reports the same message on the same element for %s as without the label', async (required) => {
      const labelled = await submit(required, true)
      labelled.form.remove()
      const unlabelled = await submit(required, false)

      expect(labelled.invalid).toEqual([labelled.twin])
      expect(unlabelled.invalid).toEqual([unlabelled.twin])
      expect(labelled.message).not.toBe('')
      expect(labelled.message).toBe(unlabelled.message)
      expect(labelled.focus).toBeTruthy()
      expect(labelled.focus).toBe(unlabelled.focus)
    })
  })
})

describe('an unnamed required checkbox group in a real browser', () => {
  it('blocks submission through a twin that has no empty label', async () => {
    const wrapper = mount(() => h('form', [
      h(CheckboxGroupRoot, { required: true }, () => h(CheckboxRoot, { 'value': 'news', 'aria-label': 'News' })),
    ]), { attachTo: document.body })
    const form = wrapper.element as HTMLFormElement
    await expect.poll(() => form.querySelector('input')).not.toBeNull()

    expect(form.querySelector('input')!.hasAttribute('aria-label')).toBe(false)
    expect(form.checkValidity()).toBe(false)
  })
})
