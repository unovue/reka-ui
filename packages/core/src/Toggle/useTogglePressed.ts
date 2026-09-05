import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState, UseControllableStateOptions } from '@/shared'
import { computed, toValue } from 'vue'
import { createPartSurface, selectionState, useControllableState } from '@/shared'

// Named `useTogglePressed` (not `useToggle`): `@vueuse/core` exports a
// `useToggle` and Nuxt auto-imports VueUse, so the plain name would collide.

/** Why the pressed state changed; carried as `details.reason` on every change (#2828). */
export type ToggleChangeReason = 'trigger-press'

export type ToggleState = { state: SelectionState, disabled: boolean }

export interface UseTogglePressedProps {
  /**
   * Controlled pressed state. A getter/ref resolving to `undefined` is
   * uncontrolled; a writable `Ref` (with no `emit`/`onUpdate`) is written back
   * ("ref-owned"). `null` is controlled and reads through as-is (the `Toggle`
   * SFC accepts `null` from `v-model`), which renders no `aria-pressed`.
   */
  modelValue?: MaybeRefOrGetter<boolean | null | undefined>
  /** Initial pressed state when uncontrolled. Left `undefined` it renders no `aria-pressed`. */
  defaultValue?: boolean
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<ToggleChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<ToggleChangeReason>) => void
}

export interface UseTogglePressedReturn {
  /**
   * The raw model: a controlled `null` and an `undefined` default pass through
   * (that is what `aria-pressed` binds, so those omit the attribute). Use
   * `pressed` for the normalised boolean.
   */
  modelValue: ComputedRef<boolean | null | undefined>
  pressed: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  toggle: (reason?: ToggleChangeReason | BaseChangeReason, event?: Event) => void
  setPressed: (pressed: boolean, reason?: ToggleChangeReason | BaseChangeReason, event?: Event) => void
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<ToggleChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<ToggleState>
}

type ToggleModelOptions = UseControllableStateOptions<boolean | null | undefined, ToggleChangeReason>

/**
 * Headless Toggle logic. The `Toggle.vue` shell composes this; standalone
 * consumers can drive a toggle button entirely from JS. SSR-safe (no
 * `document` at call scope) and reactive — props are read with `toValue`.
 *
 * Ported verbatim from `Toggle.vue`: there is NO disabled guard on the
 * click/imperative path (the native `disabled` attribute is what blocks the
 * click), so do not add one.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useTogglePressed(props: UseTogglePressedProps = {}): UseTogglePressedReturn {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<boolean | null | undefined, ToggleChangeReason>({
    // `null` is a defined (controlled) value here and reads through unchanged.
    prop: props.modelValue,
    defaultValue: props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    // Every internal write is a boolean, so the boolean-typed callbacks are safe.
    onBeforeUpdate: props.onBeforeUpdate as ToggleModelOptions['onBeforeUpdate'],
    onUpdate: props.onUpdate as ToggleModelOptions['onUpdate'],
  })
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const pressed = computed(() => !!modelValue.value)

  function setPressed(value: boolean, reason: ToggleChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    setState(value, reason, event)
  }

  function toggle(reason: ToggleChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    setPressed(!modelValue.value, reason, event)
  }

  const root = createPartSurface<ToggleState>(
    () => ({
      // Pass-through (not `pressed`) to match Toggle.vue's `:aria-pressed="modelValue"`
      // exactly: `null` / `undefined` omit the attribute, booleans render "true"/"false".
      'aria-pressed': modelValue.value,
      // Boolean, matching `:disabled="disabled"` (Vue drops a `false` boolean attribute).
      'disabled': disabled.value,
      'onClick': (event: MouseEvent) => toggle('trigger-press', event),
    }),
    () => ({ state: selectionState(pressed.value), disabled: disabled.value }),
  )

  return { modelValue, pressed, disabled, toggle, setPressed, lastChangeDetails, isControlled, root }
}
