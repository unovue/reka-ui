import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SwitchRootContext } from './SwitchRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import { computed, toValue } from 'vue'
import { createPartSurface, selectionState, useControllableState } from '@/shared'

export type SwitchChangeReason = 'trigger-press' | 'trigger-keydown'

export type SwitchState = { state: SelectionState, disabled: boolean }

export interface UseSwitchProps<T = boolean> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<T | undefined>
  defaultValue?: T
  disabled?: MaybeRefOrGetter<boolean | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
  /** Form submission value, default `'on'`. */
  value?: MaybeRefOrGetter<string>
  /** Value when on, default `true`. */
  trueValue?: MaybeRefOrGetter<T>
  /** Value when off, default `false`. */
  falseValue?: MaybeRefOrGetter<T>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: T, details: ChangeEventDetails<SwitchChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: T, details: ChangeEventDetails<SwitchChangeReason>) => void
}

export interface UseSwitchReturn<T = boolean> {
  modelValue: ComputedRef<T>
  checked: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  toggle: (reason?: SwitchChangeReason | BaseChangeReason, event?: Event) => void
  setChecked: (checked: boolean, reason?: SwitchChangeReason | BaseChangeReason, event?: Event) => void
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<SwitchChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<SwitchState>
  thumb: PartSurface<SwitchState>
  context: SwitchRootContext
}

function switchStateOf(context: Pick<SwitchRootContext, 'checked' | 'disabled'>): SwitchState {
  return { state: selectionState(context.checked.value), disabled: context.disabled.value }
}

/**
 * Thumb surface derived from the root context — the single derivation shared by
 * `useSwitch().thumb` and `SwitchThumb.vue` (recipe rule: one derivation, two callers).
 */
export function getSwitchThumbSurface(context: Pick<SwitchRootContext, 'checked' | 'disabled'>): PartSurface<SwitchState> {
  return createPartSurface<SwitchState>(() => ({}), () => switchStateOf(context))
}

/**
 * Headless Switch logic. The `.vue` shell composes this; standalone consumers
 * can drive a Switch entirely from JS. Keep this SSR-safe (no `document` at call
 * scope) and reactive — read props with `toValue`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSwitch<T = boolean>(props: UseSwitchProps<T> = {}): UseSwitchReturn<T> {
  const trueValue = () => (props.trueValue !== undefined ? toValue(props.trueValue) : (true as unknown as T))
  const falseValue = () => (props.falseValue !== undefined ? toValue(props.falseValue) : (false as unknown as T))

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<T, SwitchChangeReason>({
    prop: props.modelValue,
    defaultValue: () => props.defaultValue ?? falseValue(),
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const checked = computed(() => modelValue.value === trueValue())

  function setChecked(value: boolean, reason: SwitchChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (disabled.value)
      return
    setState(value ? trueValue() : falseValue(), reason, event)
  }

  function toggle(reason: SwitchChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    setChecked(!checked.value, reason, event)
  }

  function onKeydown(event: KeyboardEvent) {
    // Ported verbatim from SwitchRoot.vue's `@keydown.enter.prevent`. Switch has
    // NO modifier guard today — do not add one.
    if (event.key !== 'Enter')
      return
    event.preventDefault()
    toggle('trigger-keydown', event)
  }

  const context: SwitchRootContext = {
    checked,
    toggleCheck: () => toggle(),
    disabled: disabled as unknown as Ref<boolean>,
  }

  const root = createPartSurface<SwitchState>(
    computed(() => ({
      'role': 'switch',
      'aria-checked': checked.value,
      // Pass-through (not `|| undefined`) to match SwitchRoot's `:aria-required`
      // exactly: undefined omits, `false` renders "false".
      'aria-required': toValue(props.required),
      'value': toValue(props.value) ?? 'on',
      'disabled': disabled.value || undefined,
      'onClick': (event: MouseEvent) => toggle('trigger-press', event),
      'onKeydown': onKeydown,
    })),
    () => switchStateOf(context),
  )
  const thumb = getSwitchThumbSurface(context)

  return { modelValue, checked, disabled, toggle, setChecked, lastChangeDetails, isControlled, root, thumb, context }
}
