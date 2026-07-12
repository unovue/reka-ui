import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SwitchRootContext } from './SwitchRoot.vue'
import type { PartSurface } from '@/shared'
import { computed, ref, toValue } from 'vue'

// `PartSurface` is the shared headless-part contract (see `@/shared`). Re-exported
// here so the long-standing `Switch/index.ts` public path stays byte-identical.
export type { PartSurface }

export type SwitchState = { state: 'checked' | 'unchecked', disabled: boolean }

export interface UseSwitchProps<T = boolean> {
  /** Externally-owned state (the SFC hands its `useVModel` ref). */
  modelValue?: Ref<T>
  defaultValue?: T
  disabled?: MaybeRefOrGetter<boolean | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
  /** Form submission value, default `'on'`. */
  value?: MaybeRefOrGetter<string>
  /** Value when on, default `true`. */
  trueValue?: MaybeRefOrGetter<T>
  /** Value when off, default `false`. */
  falseValue?: MaybeRefOrGetter<T>
}

export interface UseSwitchReturn<T = boolean> {
  modelValue: Ref<T>
  checked: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  toggle: () => void
  root: PartSurface<SwitchState>
  thumb: PartSurface<SwitchState>
  context: SwitchRootContext
}

/**
 * Headless Switch logic. The `.vue` shell composes this; standalone consumers
 * can drive a Switch entirely from JS. Keep this SSR-safe (no `document` at call
 * scope) and reactive — read props with `toValue`.
 */
export function useSwitch<T = boolean>(props: UseSwitchProps<T> = {}): UseSwitchReturn<T> {
  const trueValue = () => (props.trueValue !== undefined ? toValue(props.trueValue) : (true as unknown as T))
  const falseValue = () => (props.falseValue !== undefined ? toValue(props.falseValue) : (false as unknown as T))

  const modelValue = (props.modelValue ?? ref<T>(props.defaultValue ?? falseValue())) as Ref<T>
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const checked = computed(() => modelValue.value === trueValue())

  function toggle() {
    if (disabled.value)
      return
    modelValue.value = checked.value ? falseValue() : trueValue()
  }

  function onKeydown(event: KeyboardEvent) {
    // Ported verbatim from SwitchRoot.vue's `@keydown.enter.prevent`. Switch has
    // NO modifier guard today — do not add one.
    if (event.key !== 'Enter')
      return
    event.preventDefault()
    toggle()
  }

  const semantic = computed<SwitchState>(() => ({
    state: checked.value ? 'checked' : 'unchecked',
    disabled: disabled.value,
  }))

  const root: PartSurface<SwitchState> = {
    props: computed(() => ({
      'role': 'switch',
      'aria-checked': checked.value,
      // Pass-through (not `|| undefined`) to match SwitchRoot's `:aria-required`
      // exactly: undefined omits, `false` renders "false".
      'aria-required': toValue(props.required),
      'value': toValue(props.value) ?? 'on',
      'disabled': disabled.value || undefined,
      'onClick': () => toggle(),
      'onKeydown': onKeydown,
    })),
    state: semantic,
  }
  const thumb: PartSurface<SwitchState> = { props: computed(() => ({})), state: semantic }

  const context: SwitchRootContext = {
    checked,
    toggleCheck: toggle,
    disabled: disabled as unknown as Ref<boolean>,
  }

  return { modelValue, checked, disabled, toggle, root, thumb, context }
}
