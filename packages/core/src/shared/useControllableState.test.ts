import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createChangeEventDetails, useControllableState } from './useControllableState'

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
