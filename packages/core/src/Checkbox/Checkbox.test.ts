import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { PropType } from 'vue'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import { handleSubmit, sleep } from '@/test'
import { CheckboxGroupRoot, CheckboxRoot } from '.'
import Checkbox from './story/_Checkbox.vue'
import CheckboxGroup from './story/_CheckboxGroup.vue'

globalThis.ResizeObserver = class ResizeObserver {
  cb: any
  constructor(cb: any) {
    this.cb = cb
  }

  observe() {
    this.cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }])
  }

  unobserve() {}
  disconnect() {}
}

describe('given a default Checkbox', () => {
  it('should pass axe accessibility tests', async () => {
    const wrapper = mount(Checkbox, { attachTo: document.body })
    expect(await axe(wrapper.element, {
      rules: {
        'label': { enabled: false },
        'nested-interactive': { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should render checkbox', () => {
    const wrapper = mount(Checkbox)
    expect(wrapper.element).toBeTruthy()
  })

  describe('when clicking the checkbox', async () => {
    let wrapper: VueWrapper<InstanceType<typeof Checkbox>>
    let checkbox: DOMWrapper<HTMLButtonElement>

    beforeEach(async () => {
      wrapper = mount(Checkbox)
      checkbox = wrapper.find('button')
      checkbox.trigger('click')
    })

    it('should render a visible indicator', async () => {
      const span = wrapper.find('span')
      expect(span.exists()).toBe(true)
    })

    describe('when clicking the checkbox again', async () => {
      beforeEach(async () => {
        await checkbox.trigger('click')
      })
      it('should remove the indicator', async () => {
        expect(wrapper.find('span').exists()).toBe(false)
      })
    })
  })
})

describe('given a Checkbox with an explicit aria-label', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not query the DOM for a label', () => {
    const querySpy = vi.spyOn(document, 'querySelector')
    const wrapper = mount(CheckboxRoot, {
      attachTo: document.body,
      attrs: { 'id': 'with-label', 'aria-label': 'Accept terms' },
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe('Accept terms')
    expect(querySpy).not.toHaveBeenCalledWith('[for="with-label"]')
  })

  it('should query for the associated label when no aria-label is given', async () => {
    const querySpy = vi.spyOn(document, 'querySelector')
    mount(CheckboxRoot, {
      attachTo: document.body,
      attrs: { id: 'without-label' },
    })
    await nextTick()

    expect(querySpy).toHaveBeenCalledWith('[for="without-label"]')
  })
})

describe('given a required Checkbox', () => {
  const wrapper = mount({
    components: { Checkbox },
    template: '<form><Checkbox required /></form>',
  })

  it('should have [aria-required] of "true"', () => {
    expect(wrapper.find('button').attributes('aria-required')).toEqual('true')
    expect(wrapper.find('[type="checkbox"]').attributes('required')).toBeDefined()
  })
})

describe('given a named Checkbox in a form', () => {
  it('has the new state in the form data when its change event fires', async () => {
    const wrapper = mount({
      components: { CheckboxRoot },
      template: '<form><CheckboxRoot name="agree" aria-label="Agree" /></form>',
    })
    const form = wrapper.find('form').element as HTMLFormElement
    const seen: [string, FormDataEntryValue][][] = []
    form.addEventListener('change', () => seen.push([...new FormData(form)]))
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')
    expect(seen).toEqual([[['agree', 'on']], []])
    wrapper.unmount()
  })
})

describe('given CheckboxGroup', () => {
  it('should pass axe accessibility tests', async () => {
    const wrapper = mount(CheckboxGroup, { attachTo: document.body })
    expect(await axe(wrapper.element, {
      rules: {
        label: { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should render checkbox', () => {
    const wrapper = mount(CheckboxGroup)
    expect(wrapper.element).toBeTruthy()
  })

  describe('when clicking the checkbox', async () => {
    let wrapper: VueWrapper<InstanceType<typeof CheckboxGroup>>
    let checkboxes: DOMWrapper<HTMLButtonElement>[]

    beforeEach(async () => {
      wrapper = mount(CheckboxGroup)
      checkboxes = wrapper.findAll('button')
      checkboxes[0].trigger('click')
    })

    it('should render a visible indicator', async () => {
      const span = wrapper.find('span')
      expect(span.exists()).toBe(true)
    })

    describe('when clicking the checkbox again', async () => {
      beforeEach(async () => {
        await checkboxes[0].trigger('click')
      })
      it('should remove the indicator', async () => {
        expect(wrapper.find('span').exists()).toBe(false)
      })
    })

    describe('when clicking another checkbox', async () => {
      beforeEach(async () => {
        await checkboxes[1].trigger('click')
      })

      it('should render 2 checkboxes', async () => {
        expect(checkboxes[0].attributes('data-state')).toBe('checked')
        expect(checkboxes[1].attributes('data-state')).toBe('checked')
        expect(checkboxes[2].attributes('data-state')).toBe('unchecked')
      })
    })
  })
})

describe('given a disabled Checkbox', () => {
  const wrapper = mount(Checkbox, { props: { disabled: true } })

  it('should have no accessibility violations', async () => {
    expect(await axe(wrapper.element, {
      rules: {
        'label': { enabled: false },
        'nested-interactive': { enabled: false },
      },
    })).toHaveNoViolations()
  })

  describe('when clicking the checkbox', async () => {
    const checkbox = wrapper.find('button')
    await checkbox.trigger('click')
    it('should not render a indicator', async () => {
      expect(wrapper.find('span').exists()).toBeFalsy()
    })
  })
})

describe('given a disabled CheckboxGroup', () => {
  const wrapper = mount(CheckboxGroup, { props: { disabled: true } })

  it('should have no accessibility violations', async () => {
    expect(await axe(wrapper.element, {
      rules: {
        label: { enabled: false },
      },
    })).toHaveNoViolations()
  })

  describe('when clicking the checkboxGroup', async () => {
    const checkboxes = wrapper.findAll('button')
    await checkboxes[0].trigger('click')

    it('should not render a indicator', async () => {
      expect(wrapper.find('span').exists()).toBeFalsy()
    })
  })
})

describe('given a CheckboxGroup with max', () => {
  let wrapper: VueWrapper<InstanceType<typeof CheckboxGroup>>
  let checkboxes: DOMWrapper<HTMLButtonElement>[]

  beforeEach(async () => {
    wrapper = mount(CheckboxGroup, { props: { max: 2 } })
    checkboxes = wrapper.findAll('button')
    await checkboxes[0].trigger('click')
    await checkboxes[1].trigger('click')
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('should mark the unchecked checkboxes disabled once the limit is reached', () => {
    expect(checkboxes[0].attributes('aria-disabled')).toBeUndefined()
    expect(checkboxes[1].attributes('aria-disabled')).toBeUndefined()
    expect(checkboxes[2].attributes('aria-disabled')).toBe('true')
  })

  it('should keep the limited checkboxes focusable', () => {
    expect(checkboxes[2].attributes('disabled')).toBeUndefined()
    // `RovingFocusGroup` skips items with `data-disabled`
    expect(checkboxes[2].attributes('data-disabled')).toBeUndefined()
  })

  it('should reach the limited checkboxes with arrow keys', async () => {
    wrapper.unmount()
    // The story forwards its own props, so the omitted boolean would be cast to `false`
    wrapper = mount(CheckboxGroup, { props: { max: 1, rovingFocus: true }, attachTo: document.body })
    checkboxes = wrapper.findAll('button')
    await checkboxes[0].trigger('click')
    checkboxes[0].element.focus()
    await checkboxes[0].trigger('keydown', { key: 'ArrowDown' })
    await sleep(0)
    expect(document.activeElement).toBe(checkboxes[1].element)
  })

  it('should have no accessibility violations', async () => {
    expect(await axe(wrapper.element, {
      rules: {
        label: { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should not check another checkbox past the limit', async () => {
    await checkboxes[2].trigger('click')
    expect(checkboxes[2].attributes('data-state')).toBe('unchecked')
  })

  describe('when unchecking a checkbox', () => {
    beforeEach(async () => {
      await checkboxes[0].trigger('click')
    })

    it('should enable the remaining checkboxes again', () => {
      expect(checkboxes[2].attributes('aria-disabled')).toBeUndefined()
    })
  })
})

describe('given a CheckboxGroup with max rendered asChild', () => {
  // A non-button element doesn't block clicks natively, so the click handler
  // itself has to enforce the limit.
  const wrapper = mount({
    components: { CheckboxGroupRoot, CheckboxRoot },
    template: `<CheckboxGroupRoot :max="1">
      <CheckboxRoot v-for="v in ['a', 'b']" :key="v" :value="v" :aria-label="v" as-child>
        <div />
      </CheckboxRoot>
    </CheckboxGroupRoot>`,
  })

  it('should not check another checkbox past the limit', async () => {
    const checkboxes = wrapper.findAll('[role="checkbox"]')
    await checkboxes[0].trigger('click')
    await checkboxes[1].trigger('click')
    expect(checkboxes[0].attributes('data-state')).toBe('checked')
    expect(checkboxes[1].attributes('data-state')).toBe('unchecked')
  })
})

describe('given a disabled Checkbox rendered asChild', () => {
  const wrapper = mount({
    components: { CheckboxRoot },
    template: `<CheckboxRoot aria-label="a" disabled as-child><div /></CheckboxRoot>`,
  })

  it('should not toggle when clicked', async () => {
    const checkbox = wrapper.find('[role="checkbox"]')
    await checkbox.trigger('click')
    expect(checkbox.attributes('data-state')).toBe('unchecked')
    expect(checkbox.attributes('aria-disabled')).toBe('true')
  })
})

describe('given a CheckboxGroup with max set to null', () => {
  const wrapper = mount(CheckboxGroup, { props: { max: null } })

  it('should not limit the selection', async () => {
    const checkboxes = wrapper.findAll('button')
    for (const checkbox of checkboxes)
      await checkbox.trigger('click')
    for (const checkbox of checkboxes)
      expect(checkbox.attributes('data-state')).toBe('checked')
  })
})

describe('given value as "indeterminate"', async () => {
  const wrapper = mount(Checkbox, { props: { modelValue: 'indeterminate' } })

  it('should have [data-state] of "indeterminate"', () => {
    expect(wrapper.find('button').attributes('data-state')).toBe('indeterminate')
    expect(wrapper.find('span').attributes('data-state')).toBe('indeterminate')
  })

  it('should still be clickable', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('data-state')).toBe('checked')
  })
})

describe('given checkbox in a form', async () => {
  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Checkbox },
    template: '<form @submit="handleSubmit"><Checkbox value="true" /></form>',
  }, {
    props: { handleSubmit },
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('[type="checkbox"]').exists()).toBe(true)
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not nest the hidden input inside the interactive control', () => {
    expect(wrapper.find('button input').exists()).toBe(false)
  })

  describe('after clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: 'true' })
    })
  })

  describe('after uncheck and click submit button again', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ })
    })
  })

  afterAll(() => {
    handleSubmit.mockReset()
  })
})

describe('given checkboxGroup in a form', async () => {
  const wrapper = mount({
    props: ['handleSubmit'],
    components: { CheckboxGroup },
    template: '<form @submit="handleSubmit"><CheckboxGroup name="test" /></form>',
  }, {
    props: { handleSubmit },
  })

  let checkboxes: DOMWrapper<HTMLButtonElement>[]
  let form: DOMWrapper<HTMLFormElement>

  beforeEach(async () => {
    handleSubmit.mockClear()
    checkboxes = wrapper.findAll('button')
    form = wrapper.find('form')

    if (checkboxes[0].attributes('data-state') === 'unchecked')
      await checkboxes[0].trigger('click')
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('input[data-hidden]').exists()).toBe(true)
  })

  describe('after clicking submit button', () => {
    it('should trigger submit once', async () => {
      await form.trigger('submit')

      // Work around as the `handleSubmit.mock.results[0].value` is returning undefined
      const event = handleSubmit.mock.calls[0][0]
      const formData = new FormData(event.target)
      const submittedData = Object.fromEntries(formData as any)

      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(submittedData).toStrictEqual({ 'test[0][name]': 'jack' })
    })
  })

  describe('after uncheck and click submit button again', () => {
    beforeEach(async () => {
      await checkboxes[0].trigger('click')
      await form.trigger('submit')
    })

    it('should trigger submit once', () => {
      // Work around as the `handleSubmit.mock.results[0].value` is returning undefined
      const event = handleSubmit.mock.calls[0][0]
      const formData = new FormData(event.target)
      const submittedData = Object.fromEntries(formData as any)

      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(submittedData).toStrictEqual({ })
    })
  })
})

describe('given a parent Checkbox', () => {
  interface Item { value: any, label: string, disabled?: boolean, id?: string }
  const ParentGroup = defineComponent({
    components: { CheckboxGroupRoot, CheckboxRoot },
    props: {
      items: { type: Array as PropType<Item[]>, default: () => [
        { value: 'a', label: 'A', id: 'a' },
        { value: 'b', label: 'B', id: 'b' },
        { value: 'c', label: 'C', id: 'c' },
      ] },
      allValues: { type: Array as PropType<any[]>, default: undefined },
      modelValue: { type: Array as PropType<any[]>, default: undefined },
      defaultValue: { type: Array as PropType<any[]>, default: undefined },
      max: { type: Number, default: undefined },
      name: { type: String, default: undefined },
    },
    emits: ['update:modelValue'],
    template: `<CheckboxGroupRoot
      :model-value="modelValue"
      :default-value="defaultValue"
      :all-values="allValues === undefined ? items.map(i => i.value) : allValues"
      :max="max"
      :name="name"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <CheckboxRoot id="parent" aria-label="All" parent />
      <CheckboxRoot
        v-for="item in items"
        :id="item.id"
        :key="item.label"
        :value="item.value"
        :aria-label="item.label"
        :disabled="item.disabled"
      />
    </CheckboxGroupRoot>`,
  })

  function getParent(wrapper: VueWrapper<any>) {
    return wrapper.find('#parent')
  }
  function getStates(wrapper: VueWrapper<any>) {
    return wrapper.findAll('[role="checkbox"]:not(#parent)').map(c => c.attributes('data-state'))
  }
  function lastEmitted(wrapper: VueWrapper<any>) {
    return wrapper.emitted('update:modelValue')!.at(-1)![0]
  }

  it('should pass axe accessibility tests', async () => {
    const wrapper = mount(ParentGroup, { props: { defaultValue: ['a'] }, attachTo: document.body })
    await nextTick()
    expect(await axe(wrapper.element)).toHaveNoViolations()
    wrapper.unmount()
  })

  it('should be indeterminate when some values are checked', () => {
    const wrapper = mount(ParentGroup, { props: { defaultValue: ['a'] } })
    expect(getParent(wrapper).attributes('data-state')).toBe('indeterminate')
    expect(getParent(wrapper).attributes('aria-checked')).toBe('mixed')
  })

  it('should be checked when every value is checked', () => {
    const wrapper = mount(ParentGroup, { props: { defaultValue: ['c', 'a', 'b'] } })
    expect(getParent(wrapper).attributes('data-state')).toBe('checked')
  })

  it('should check every child, then uncheck every child (uncontrolled)', async () => {
    const wrapper = mount(ParentGroup, { props: { defaultValue: ['a'] } })
    await getParent(wrapper).trigger('click')
    expect(getStates(wrapper)).toEqual(['checked', 'checked', 'checked'])
    expect(getParent(wrapper).attributes('data-state')).toBe('checked')
    await getParent(wrapper).trigger('click')
    expect(getStates(wrapper)).toEqual(['unchecked', 'unchecked', 'unchecked'])
    expect(getParent(wrapper).attributes('data-state')).toBe('unchecked')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['a', 'b', 'c']], [[]]])
  })

  it('should follow a controlled model', async () => {
    const wrapper = mount(ParentGroup, {
      props: {
        'modelValue': ['b'],
        'onUpdate:modelValue': (value: any[]) => wrapper.setProps({ modelValue: value }),
      },
    })
    await getParent(wrapper).trigger('click')
    expect(wrapper.props('modelValue')).toEqual(['b', 'a', 'c'])
    expect(getParent(wrapper).attributes('data-state')).toBe('checked')

    await wrapper.setProps({ modelValue: ['c'] })
    expect(getParent(wrapper).attributes('data-state')).toBe('indeterminate')
    await wrapper.setProps({ modelValue: [] })
    expect(getParent(wrapper).attributes('data-state')).toBe('unchecked')
  })

  it('should toggle with the Space key', async () => {
    const user = userEvent.setup()
    const wrapper = mount(ParentGroup, { props: { defaultValue: ['a'] }, attachTo: document.body })
    ;(getParent(wrapper).element as HTMLElement).focus()
    await user.keyboard(' ')
    expect(getStates(wrapper)).toEqual(['checked', 'checked', 'checked'])
    await user.keyboard(' ')
    expect(getStates(wrapper)).toEqual(['unchecked', 'unchecked', 'unchecked'])
    wrapper.unmount()
  })

  it('should keep values that are not in allValues', async () => {
    const wrapper = mount(ParentGroup, { props: { defaultValue: ['other', 'a'] } })
    await getParent(wrapper).trigger('click')
    expect(lastEmitted(wrapper)).toEqual(['other', 'a', 'b', 'c'])
    await getParent(wrapper).trigger('click')
    expect(lastEmitted(wrapper)).toEqual(['other'])
  })

  it('should be unchecked and do nothing when allValues is empty', async () => {
    const wrapper = mount(ParentGroup, { props: { items: [], defaultValue: [] } })
    expect(getParent(wrapper).attributes('data-state')).toBe('unchecked')
    expect(getParent(wrapper).attributes('aria-checked')).toBe('false')
    await getParent(wrapper).trigger('click')
    expect(getParent(wrapper).attributes('data-state')).toBe('unchecked')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
  })

  describe('with object values', () => {
    const items = [
      { value: { id: 1 }, label: 'One' },
      { value: { id: 2 }, label: 'Two' },
    ]

    it('should compare values structurally', async () => {
      const wrapper = mount(ParentGroup, {
        props: { items, allValues: [{ id: 1 }, { id: 2 }], defaultValue: [{ id: 2 }, { id: 1 }] },
      })
      expect(getParent(wrapper).attributes('data-state')).toBe('checked')
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual([])
    })

    it('should not duplicate values when checking all', async () => {
      const wrapper = mount(ParentGroup, {
        props: { items, allValues: [{ id: 1 }, { id: 2 }], defaultValue: [{ id: 1 }] },
      })
      expect(getParent(wrapper).attributes('data-state')).toBe('indeterminate')
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual([{ id: 1 }, { id: 2 }])
    })
  })

  describe('with disabled children', () => {
    const items = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C', disabled: true },
    ]

    it('should leave a disabled unchecked child unchecked when checking all', async () => {
      const wrapper = mount(ParentGroup, { props: { items, defaultValue: ['c'] } })
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual(['c', 'a'])
      expect(getParent(wrapper).attributes('data-state')).toBe('indeterminate')
    })

    it('should leave a disabled checked child checked when unchecking all', async () => {
      const wrapper = mount(ParentGroup, { props: { items, defaultValue: ['a', 'b', 'c'] } })
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual(['b', 'c'])
    })

    it('should uncheck the enabled children when only disabled ones are left unchecked', async () => {
      const wrapper = mount(ParentGroup, { props: { items, defaultValue: ['a', 'c'] } })
      expect(getParent(wrapper).attributes('data-state')).toBe('indeterminate')
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual(['c'])
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual(['c', 'a'])
    })
  })

  describe('when a child unmounts', () => {
    it('should update the parent state and stop treating the child as disabled', async () => {
      const items = [
        { value: 'a', label: 'A', id: 'a' },
        { value: 'b', label: 'B', id: 'b', disabled: true },
      ]
      const wrapper = mount(ParentGroup, { props: { items, defaultValue: ['a'] } })
      await nextTick()
      expect(getParent(wrapper).attributes('data-state')).toBe('indeterminate')
      expect(getParent(wrapper).attributes('aria-controls')).toBe('a b')

      await wrapper.setProps({ items: [items[0]] })
      expect(getParent(wrapper).attributes('data-state')).toBe('checked')
      expect(getParent(wrapper).attributes('aria-controls')).toBe('a')

      // `b` is still controlled, but no longer rendered (so no longer disabled)
      await wrapper.setProps({ allValues: ['a', 'b'] })
      expect(getParent(wrapper).attributes('aria-controls')).toBe('a')
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual(['a', 'b'])
    })
  })

  describe('aria-controls', () => {
    it('should reference the ids of the child checkboxes, generating missing ones', async () => {
      const wrapper = mount(ParentGroup, {
        props: { items: [{ value: 'a', label: 'A', id: 'first' }, { value: 'b', label: 'B' }] },
      })
      await nextTick()
      const ids = getParent(wrapper).attributes('aria-controls')!.split(' ')
      const children = wrapper.findAll('[role="checkbox"]:not(#parent)')
      expect(ids).toEqual(children.map(c => c.attributes('id')))
      expect(ids[0]).toBe('first')
      expect(ids[1]).toMatch(/^reka-checkbox-/)
    })

    it('should not generate ids in a group without allValues', () => {
      const wrapper = mount({
        components: { CheckboxGroupRoot, CheckboxRoot },
        template: `<CheckboxGroupRoot><CheckboxRoot value="a" aria-label="A" /></CheckboxGroupRoot>`,
      })
      expect(wrapper.find('[role="checkbox"]').attributes('id')).toBeUndefined()
    })
  })

  describe('when allValues is set after mount', () => {
    const LateGroup = defineComponent({
      components: { CheckboxGroupRoot, CheckboxRoot },
      props: { allValues: { type: Array as PropType<string[]>, default: undefined } },
      emits: ['update:modelValue'],
      template: `<CheckboxGroupRoot
        :default-value="['a']"
        :all-values="allValues"
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <CheckboxRoot id="parent" aria-label="All" parent />
        <CheckboxRoot value="a" aria-label="A" />
        <CheckboxRoot value="b" aria-label="B" disabled />
        <CheckboxRoot value="c" aria-label="C" />
      </CheckboxGroupRoot>`,
    })

    function getChildIds(wrapper: VueWrapper<any>) {
      return wrapper.findAll('[role="checkbox"]:not(#parent)').map(c => c.attributes('id'))
    }

    it('should register the children and generate their ids without remounting', async () => {
      const wrapper = mount(LateGroup)
      await nextTick()
      expect(getChildIds(wrapper)).toEqual([undefined, undefined, undefined])
      expect(getParent(wrapper).attributes('aria-controls')).toBeUndefined()

      await wrapper.setProps({ allValues: ['a', 'b', 'c'] })
      const ids = getChildIds(wrapper)
      expect(ids.every(id => id?.startsWith('reka-checkbox-'))).toBe(true)
      expect(new Set(ids).size).toBe(3)
      expect(getParent(wrapper).attributes('aria-controls')).toBe(ids.join(' '))
      expect(getParent(wrapper).attributes('data-state')).toBe('indeterminate')

      // The disabled, unchecked `b` stays unchecked
      await getParent(wrapper).trigger('click')
      expect(lastEmitted(wrapper)).toEqual(['a', 'c'])
    })

    it('should unregister the children and drop their ids when allValues is removed', async () => {
      const wrapper = mount(LateGroup, { props: { allValues: ['a', 'b', 'c'] } })
      await nextTick()
      const ids = getChildIds(wrapper)
      expect(getParent(wrapper).attributes('aria-controls')).toBe(ids.join(' '))

      await wrapper.setProps({ allValues: undefined })
      expect(getChildIds(wrapper)).toEqual([undefined, undefined, undefined])
      expect(getParent(wrapper).attributes('aria-controls')).toBeUndefined()

      // Set again: the same ids come back
      await wrapper.setProps({ allValues: ['a', 'b', 'c'] })
      expect(getChildIds(wrapper)).toEqual(ids)
      expect(getParent(wrapper).attributes('aria-controls')).toBe(ids.join(' '))
    })
  })

  it('should check up to the group max and stay enabled', async () => {
    const wrapper = mount(ParentGroup, { props: { max: 2, defaultValue: [] } })
    await getParent(wrapper).trigger('click')
    expect(lastEmitted(wrapper)).toEqual(['a', 'b'])
    expect(getParent(wrapper).attributes('aria-disabled')).toBeUndefined()
    await getParent(wrapper).trigger('click')
    expect(lastEmitted(wrapper)).toEqual([])
  })

  it('should not submit a value of its own in a form', async () => {
    const wrapper = mount({
      components: { ParentGroup },
      template: '<form><ParentGroup name="letters" :default-value="[]" /></form>',
    })
    const form = wrapper.find('form').element as HTMLFormElement
    await wrapper.find('#parent').trigger('click')
    const values = Array.from(new FormData(form), ([, value]) => value)
    expect(values).toEqual(['a', 'b', 'c'])
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0)
  })

  it('should behave like a regular checkbox outside a group', async () => {
    const wrapper = mount(CheckboxRoot, { props: { parent: true }, attrs: { 'aria-label': 'x' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('data-state')).toBe('checked')
  })
})
