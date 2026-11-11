import { describe, expect, it, vi } from 'vitest'
import { computed, isRef, ref, toRaw, watchEffect } from 'vue'
import { createChangeEventDetails, resetControllableState, useControllableState } from './useControllableState'

describe('createChangeEventDetails', () => {
  it('starts un-cancelled with the given reason/event', () => {
    const event = new Event('click')
    const details = createChangeEventDetails('click', event)
    expect(details.reason).toBe('click')
    expect(details.event).toBe(event)
    expect(details.isCanceled).toBe(false)
  })
  it('cancel() flips isCanceled', () => {
    const details = createChangeEventDetails('none')
    details.cancel()
    expect(details.isCanceled).toBe(true)
  })
  it('keeps its shape, with `isCanceled` as a plain data property (no getter closure)', () => {
    const event = new Event('click')
    const trigger = document.createElement('button')
    const details = createChangeEventDetails('trigger-press', event, trigger)
    expect(Object.keys(details)).toEqual(['reason', 'event', 'trigger', 'cancel', 'isCanceled'])
    expect({ ...details }).toEqual({ reason: 'trigger-press', event, trigger, cancel: expect.any(Function), isCanceled: false })
    // An accessor on the literal would be kept in V8's shared map and retain one
    // details object (and its event's detached DOM) for the page's lifetime.
    const descriptor = Object.getOwnPropertyDescriptor(details, 'isCanceled')!
    expect(descriptor.get).toBeUndefined()
    expect(descriptor.enumerable).toBe(true)
    // `cancel` works detached from the object, and only flips this details.
    const other = createChangeEventDetails('none')
    const { cancel } = details
    cancel()
    expect(details.isCanceled).toBe(true)
    expect(other.isCanceled).toBe(false)
  })
})

describe('useControllableState', () => {
  it('is pure: callable outside setup() with the default value', () => {
    const { state, isControlled, lastChangeDetails } = useControllableState<boolean>({ defaultValue: false })
    expect(state.value).toBe(false)
    expect(isControlled.value).toBe(false)
    expect(lastChangeDetails.value).toMatchObject({ reason: 'none', isCanceled: false })
  })

  it('calls a factory defaultValue', () => {
    const { state } = useControllableState<string[]>({ defaultValue: () => ['a'] })
    expect(state.value).toEqual(['a'])
  })

  it('uncontrolled: setState writes the internal value and returns true', () => {
    const { state, setState, lastChangeDetails } = useControllableState<boolean>({ defaultValue: false })
    expect(setState(true)).toBe(true)
    expect(state.value).toBe(true)
    expect(lastChangeDetails.value.reason).toBe('imperative-action')
  })

  it('controlled getter: no internal write, update: emitted with [value, details]', () => {
    const emit = vi.fn()
    const open = ref(false)
    const { state, setState, isControlled } = useControllableState<boolean>({
      prop: () => open.value,
      defaultValue: true,
      name: 'open',
      emit,
    })
    expect(isControlled.value).toBe(true)
    expect(setState(true)).toBe(true)
    // The parent's update: handler owns the write; the prop still reads false.
    expect(state.value).toBe(false)
    expect(open.value).toBe(false)
    expect(emit).toHaveBeenCalledWith('update:open', true, expect.objectContaining({ reason: 'imperative-action', isCanceled: false }))
    // Parent writes back → state follows the prop.
    open.value = true
    expect(state.value).toBe(true)
  })

  it('a getter resolving to undefined means uncontrolled', () => {
    const model = ref<boolean | undefined>(undefined)
    const { state, setState, isControlled } = useControllableState<boolean>({ prop: () => model.value, defaultValue: false })
    expect(isControlled.value).toBe(false)
    setState(true)
    expect(state.value).toBe(true)
    expect(model.value).toBeUndefined()
  })

  it('controlled then cleared to undefined stays controlled and reads undefined, not the default', () => {
    const emit = vi.fn()
    const model = ref<string | undefined>('a')
    const { state, setState, isControlled } = useControllableState<string>({
      prop: () => model.value,
      defaultValue: 'b',
      name: 'modelValue',
      emit,
    })
    expect(isControlled.value).toBe(true)
    expect(state.value).toBe('a')
    model.value = undefined
    expect(isControlled.value).toBe(true)
    expect(state.value).toBeUndefined()
    // Still controlled: no internal write, the parent's update: handler owns it.
    expect(setState('c')).toBe(true)
    expect(state.value).toBeUndefined()
    expect(emit).toHaveBeenCalledWith('update:modelValue', 'c', expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('a getter that starts undefined then resolves switches to controlled and never falls back', () => {
    const model = ref<boolean | undefined>(undefined)
    const { state, setState, isControlled } = useControllableState<boolean>({
      prop: () => model.value,
      defaultValue: false,
    })
    expect(isControlled.value).toBe(false)
    // Uncontrolled write leaves a stale internal value behind …
    setState(true)
    expect(state.value).toBe(true)
    // … the parent takes over …
    model.value = false
    expect(isControlled.value).toBe(true)
    expect(state.value).toBe(false)
    // … and clearing the prop must not resurrect the stale internal value.
    model.value = undefined
    expect(isControlled.value).toBe(true)
    expect(state.value).toBeUndefined()
  })

  it('ref-owned mode writes the ref when neither emit nor onUpdate is given', () => {
    const model = ref<boolean | undefined>(false)
    const { state, setState, isControlled } = useControllableState<boolean>({ prop: model })
    expect(isControlled.value).toBe(true)
    expect(setState(true)).toBe(true)
    expect(model.value).toBe(true)
    expect(state.value).toBe(true)
  })

  it('ref-owned mode with an initially-undefined ref: reads the default and setState writes the ref', () => {
    const model = ref<boolean | undefined>(undefined)
    const { state, setState, isControlled } = useControllableState<boolean>({ prop: model, defaultValue: false })
    expect(isControlled.value).toBe(true)
    expect(state.value).toBe(false)
    expect(setState(true)).toBe(true)
    expect(model.value).toBe(true)
    expect(state.value).toBe(true)
    // The ref is the single store: clearing it falls back to the default, not a stale internal value.
    model.value = undefined
    expect(state.value).toBe(false)
  })

  it('ref-owned mode writes the default value into an undefined ref instead of treating it as a no-op', () => {
    const model = ref<boolean | undefined>(undefined)
    const { state, setState } = useControllableState<boolean>({ prop: model, defaultValue: false })
    // `state` already reads `false` via the fallback, but the ref is still undefined,
    // so this is a real write, not an unchanged value.
    expect(setState(false)).toBe(true)
    expect(model.value).toBe(false)
    expect(state.value).toBe(false)
    // Now the ref holds `false`: the same value IS a no-op.
    expect(setState(false)).toBe(false)
  })

  it('onUpdate mode does not write the ref', () => {
    const model = ref<boolean | undefined>(false)
    const onUpdate = vi.fn()
    const { setState } = useControllableState<boolean>({ prop: model, onUpdate })
    expect(setState(true)).toBe(true)
    expect(model.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('isEqual short-circuit returns false and emits nothing', () => {
    const emit = vi.fn()
    const onBeforeUpdate = vi.fn()
    const { setState } = useControllableState<boolean>({ defaultValue: true, name: 'open', emit, onBeforeUpdate })
    expect(setState(true)).toBe(false)
    expect(emit).not.toHaveBeenCalled()
    expect(onBeforeUpdate).not.toHaveBeenCalled()
  })

  it('honours a custom isEqual', () => {
    const { state, setState } = useControllableState<{ id: number }>({
      defaultValue: { id: 1 },
      isEqual: (a, b) => a.id === b.id,
    })
    expect(setState({ id: 1 })).toBe(false)
    expect(setState({ id: 2 })).toBe(true)
    expect(state.value.id).toBe(2)
  })

  it('cancel in onBeforeUpdate: no write, no update: emit, lastChangeDetails.isCanceled === true', () => {
    const emit = vi.fn()
    const onUpdate = vi.fn()
    const { state, setState, lastChangeDetails } = useControllableState<boolean>({
      defaultValue: false,
      name: 'open',
      emit,
      onUpdate,
      onBeforeUpdate: (_value, details) => details.cancel(),
    })
    expect(setState(true)).toBe(false)
    expect(state.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit.mock.calls[0]![0]).toBe('beforeUpdate:open')
    expect(lastChangeDetails.value.isCanceled).toBe(true)
  })

  it('cancel via the emitted beforeUpdate: listener', () => {
    const emit = vi.fn((event: string, _value: boolean, details: { cancel: () => void }) => {
      if (event === 'beforeUpdate:open')
        details.cancel()
    })
    const { state, setState } = useControllableState<boolean>({ defaultValue: false, name: 'open', emit })
    expect(setState(true)).toBe(false)
    expect(state.value).toBe(false)
    expect(emit.mock.calls.map(c => c[0])).toEqual(['beforeUpdate:open'])
  })

  it('emits beforeUpdate:<name> then update:<name>, with details as the second arg', () => {
    const emit = vi.fn()
    const { setState } = useControllableState<boolean>({ defaultValue: false, name: 'open', emit })
    const event = new Event('keydown')
    setState(true, 'escape-key', event)
    expect(emit.mock.calls.map(c => c[0])).toEqual(['beforeUpdate:open', 'update:open'])
    const [, value, details] = emit.mock.calls[1]!
    expect(value).toBe(true)
    expect(details.reason).toBe('escape-key')
    expect(details.event).toBe(event)
    // The same details object flows through both phases.
    expect(emit.mock.calls[0]![2]).toBe(details)
  })

  it('does not emit when no name is given', () => {
    const emit = vi.fn()
    const { setState } = useControllableState<boolean>({ defaultValue: false, emit })
    expect(setState(true)).toBe(true)
    expect(emit).not.toHaveBeenCalled()
  })

  it('runs onBeforeUpdate before the beforeUpdate: emit and onUpdate before the update: emit', () => {
    const order: string[] = []
    const { setState } = useControllableState<boolean>({
      defaultValue: false,
      name: 'open',
      emit: (event: string) => order.push(event),
      onBeforeUpdate: () => order.push('onBeforeUpdate'),
      onUpdate: () => order.push('onUpdate'),
    })
    setState(true)
    expect(order).toEqual(['onBeforeUpdate', 'beforeUpdate:open', 'onUpdate', 'update:open'])
  })

  it('reason defaults to imperative-action', () => {
    const { setState, lastChangeDetails } = useControllableState<boolean>({ defaultValue: false })
    setState(true)
    expect(lastChangeDetails.value.reason).toBe('imperative-action')
    expect(lastChangeDetails.value.event).toBeUndefined()
  })

  it('late cancel() is a no-op that warns in dev', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { state, setState, lastChangeDetails } = useControllableState<boolean>({ defaultValue: false })
    setState(true)
    lastChangeDetails.value.cancel()
    expect(lastChangeDetails.value.isCanceled).toBe(false)
    expect(state.value).toBe(true)
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('cancel()'))
    spy.mockRestore()
  })
})

describe('setState options (#2826)', () => {
  it('attributes the change to `options.trigger`', () => {
    const onUpdate = vi.fn()
    const { setState } = useControllableState<boolean>({ defaultValue: false, onUpdate })
    const trigger = document.createElement('button')
    setState(true, 'trigger-press', undefined, { trigger })
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', trigger }))
    expect('trigger' in createChangeEventDetails('none')).toBe(false)
  })

  it('`force` runs a cancellable cycle for an unchanged value', () => {
    const onBeforeUpdate = vi.fn()
    const onUpdate = vi.fn()
    const { setState } = useControllableState<boolean>({ defaultValue: true, onBeforeUpdate, onUpdate })
    expect(setState(true)).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()

    expect(setState(true, 'trigger-press', undefined, { force: true })).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)

    onBeforeUpdate.mockImplementationOnce((_value, details) => details.cancel())
    expect(setState(true, 'trigger-press', undefined, { force: true })).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  describe('one model object (lean)', () => {
    it('`isControlled` and `lastChangeDetails` are readonly refs', () => {
      const { isControlled, lastChangeDetails } = useControllableState<boolean>({ defaultValue: false })
      expect(isRef(isControlled)).toBe(true)
      expect(isRef(lastChangeDetails)).toBe(true)
    })

    it('`isControlled` is tracked by a computed until it latches', () => {
      const prop = ref<boolean | undefined>(undefined)
      const { isControlled, state } = useControllableState<boolean>({ prop, defaultValue: false, onUpdate: () => {} })
      const label = computed(() => isControlled.value ? 'controlled' : 'uncontrolled')
      expect(label.value).toBe('uncontrolled')
      prop.value = true
      expect(label.value).toBe('controlled')
      expect(state.value).toBe(true)
      prop.value = undefined
      expect(label.value).toBe('controlled')
      expect(state.value).toBeUndefined()
    })

    it('`lastChangeDetails` written before its first read still reads the latest details', () => {
      const { setState, lastChangeDetails } = useControllableState<boolean>({ defaultValue: false })
      setState(true, 'trigger-press')
      expect(lastChangeDetails.value.reason).toBe('trigger-press')
    })

    it('`lastChangeDetails` is reactive once read', () => {
      const { setState, lastChangeDetails } = useControllableState<boolean>({ defaultValue: false })
      const reasons: string[] = []
      const stop = watchEffect(() => {
        reasons.push(lastChangeDetails.value.reason)
      }, { flush: 'sync' })
      setState(true, 'trigger-press')
      setState(false, 'escape-key')
      stop()
      expect(reasons).toEqual(['none', 'trigger-press', 'escape-key'])
    })

    it('a controlled model that later goes uncontrolled-by-default reads `defaultValue` from the lazily created store', () => {
      const { state, setState } = useControllableState<string[]>({ prop: () => undefined, defaultValue: () => ['a'], onUpdate: () => {} })
      expect(state.value).toEqual(['a'])
      expect(setState(['b'])).toBe(true)
      expect(state.value).toEqual(['b'])
    })
  })
})

describe('resetControllableState', () => {
  it('puts an uncontrolled model back to its default, as a `none` change with the event', () => {
    const emit = vi.fn()
    const { state, setState, isControlled } = useControllableState<string>({ defaultValue: 'a', name: 'modelValue', emit })
    setState('b')
    emit.mockClear()
    const event = new Event('reset')

    expect(resetControllableState(isControlled, event)).toBe(true)

    expect(state.value).toBe('a')
    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:modelValue', 'update:modelValue'])
    expect(emit.mock.calls[1][1]).toBe('a')
    expect(emit.mock.calls[1][2]).toMatchObject({ reason: 'none', event })
  })

  it('does nothing when the model already holds its default', () => {
    const emit = vi.fn()
    const { isControlled } = useControllableState<string[]>({ defaultValue: () => ['a'], name: 'modelValue', emit })
    expect(resetControllableState(isControlled)).toBe(false)
    expect(emit).not.toHaveBeenCalled()
  })

  it('only emits the default for a controlled model', () => {
    const prop = ref<string | undefined>('b')
    const emit = vi.fn()
    const { state, isControlled } = useControllableState<string | undefined>({ prop: () => prop.value, defaultValue: 'a', name: 'modelValue', emit })

    expect(resetControllableState(isControlled)).toBe(true)

    expect(state.value).toBe('b')
    expect(emit).toHaveBeenLastCalledWith('update:modelValue', 'a', expect.objectContaining({ reason: 'none' }))
  })

  it('emits the empty value for a controlled model without a default', () => {
    const emit = vi.fn()
    const { isControlled } = useControllableState<string | undefined>({ prop: () => 'b', name: 'modelValue', emit })
    resetControllableState(isControlled)
    expect(emit).toHaveBeenLastCalledWith('update:modelValue', undefined, expect.anything())
  })

  it('is cancelled by `beforeUpdate`', () => {
    const onUpdate = vi.fn()
    const { state, setState, isControlled } = useControllableState<string>({
      defaultValue: 'a',
      onBeforeUpdate: (_, details) => {
        if (details.reason === 'none')
          details.cancel()
      },
      onUpdate,
    })
    setState('b')
    onUpdate.mockClear()

    expect(resetControllableState(isControlled, new Event('reset'))).toBe(false)

    expect(state.value).toBe('b')
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('still knows the default after the model was read and written', () => {
    const { state, setState, isControlled } = useControllableState<number[]>({ defaultValue: [1] })
    expect(state.value).toEqual([1])
    setState([2])
    setState([3])
    resetControllableState(isControlled)
    expect(state.value).toEqual([1])
  })

  it('hands out a copy of an array default, so mutating what it emitted leaves the default alone', () => {
    const defaults = ['a']
    const bound = ref<string[]>(['a', 'b'])
    const { isControlled } = useControllableState<string[]>({
      prop: () => bound.value,
      defaultValue: defaults,
      onUpdate: (value) => { bound.value = value },
    })

    resetControllableState(isControlled)
    expect(bound.value).toEqual(['a'])
    expect(bound.value).not.toBe(defaults)

    // The parent mutates its bound array in place, then resets again.
    bound.value.push('c')
    expect(defaults).toEqual(['a'])
    resetControllableState(isControlled)
    expect(bound.value).toEqual(['a'])
  })

  it('stores a copy of an array default in an uncontrolled model, and stays a no-op once reset', () => {
    const defaults = ['a']
    const onUpdate = vi.fn()
    const { state, setState, isControlled } = useControllableState<string[]>({ defaultValue: defaults, onUpdate })
    setState(['b'])
    resetControllableState(isControlled)
    expect(toRaw(state.value)).not.toBe(defaults)
    state.value.push('c')
    expect(defaults).toEqual(['a'])

    resetControllableState(isControlled)
    expect(state.value).toEqual(['a'])
    onUpdate.mockClear()
    expect(resetControllableState(isControlled)).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('copies a plain object default, and passes other objects as they are', () => {
    const range = { start: 1, end: 2 }
    const date = new Date(0)
    const seen: unknown[] = []
    const plain = useControllableState<{ start: number, end: number }>({ prop: () => ({ start: 5, end: 6 }), defaultValue: range, onUpdate: value => seen.push(value) })
    const instance = useControllableState<Date>({ prop: () => new Date(1), defaultValue: date, onUpdate: value => seen.push(value) })

    resetControllableState(plain.isControlled)
    resetControllableState(instance.isControlled)

    expect(seen[0]).toEqual(range)
    expect(seen[0]).not.toBe(range)
    expect(seen[1]).toBe(date)
  })
})
