import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ColorSwatchPickerItemContext } from './ColorSwatchPickerItem.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Color } from '@/shared/color'
import { computed, toValue } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { colorToHex, getColorName, isEqualColor } from '@/shared/color'

export type ColorSwatchPickerChangeReason = 'selection'
export type ColorSwatchPickerRootState = Record<string, never>
export type ColorSwatchPickerItemState = { color: string }
export type ColorSwatchPickerItemIndicatorState = Record<string, never>
export type ColorSwatchPickerItemSwatchState = Record<string, never>

/** A swatch value: a color string or a `Color` object. */
export type ColorSwatchPickerValue = string | Color
/** The picker model: one value, several with `multiple`, or `undefined` when cleared. */
export type ColorSwatchPickerModelValue = ColorSwatchPickerValue | ColorSwatchPickerValue[] | undefined

export interface UseColorSwatchPickerProps {
  modelValue?: MaybeRefOrGetter<ColorSwatchPickerModelValue>
  defaultValue?: MaybeRefOrGetter<ColorSwatchPickerModelValue>
  multiple?: MaybeRefOrGetter<boolean | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  selectionBehavior?: MaybeRefOrGetter<'toggle' | 'replace' | undefined>
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: ColorSwatchPickerModelValue, details: ChangeEventDetails<ColorSwatchPickerChangeReason>) => void
  onUpdate?: (value: ColorSwatchPickerModelValue, details: ChangeEventDetails<ColorSwatchPickerChangeReason>) => void
}

export interface UseColorSwatchPickerReturn {
  /** The selection: item values as declared on the items (`string | Color`), matched structurally. */
  readonly modelValue: ComputedRef<ColorSwatchPickerValue | readonly ColorSwatchPickerValue[] | undefined>
  readonly multiple: ComputedRef<boolean>
  readonly disabled: ComputedRef<boolean>
  readonly isControlled: ComputedRef<boolean>
  readonly lastChangeDetails: Readonly<Ref<ChangeEventDetails<ColorSwatchPickerChangeReason>>>
  readonly root: PartSurface<ColorSwatchPickerRootState>
  readonly listboxProps: ComputedRef<{
    'modelValue': ColorSwatchPickerModelValue
    'multiple': boolean
    'disabled': boolean
    'selectionBehavior': 'toggle' | 'replace'
    'by': (a: ColorSwatchPickerValue, b: ColorSwatchPickerValue) => boolean
    'onUpdate:modelValue': (value: ColorSwatchPickerModelValue) => void
  }>
  setValue: (value: ColorSwatchPickerModelValue, reason?: ColorSwatchPickerChangeReason | BaseChangeReason, event?: Event) => boolean
  select: (value: ColorSwatchPickerValue, event?: Event) => boolean
  getItemSurface: (value: MaybeRefOrGetter<ColorSwatchPickerValue>) => PartSurface<ColorSwatchPickerItemState>
  getItemSwatchSurface: (value: MaybeRefOrGetter<ColorSwatchPickerValue>) => PartSurface<ColorSwatchPickerItemSwatchState>
  readonly itemIndicator: PartSurface<ColorSwatchPickerItemIndicatorState>
}

/**
 * Structural swatch equality: `#ff0000` matches `{ space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 }`.
 * Strings that are not parseable colors fall back to string equality.
 * @internal
 */
export function isSameSwatchColor(a: ColorSwatchPickerValue | undefined, b: ColorSwatchPickerValue | undefined): boolean {
  if (a === b)
    return true
  if (a === undefined || b === undefined || a === '' || b === '')
    return false
  try {
    return isEqualColor(a, b)
  }
  catch {
    return false
  }
}

function isSameModel(a: ColorSwatchPickerModelValue, b: ColorSwatchPickerModelValue): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false
    return a.every((value, index) => isSameSwatchColor(value, b[index]))
  }
  return isSameSwatchColor(a, b)
}

/** A CSS color string for a swatch value. */
function toCssColor(value: ColorSwatchPickerValue): string {
  return typeof value === 'string' ? value : colorToHex(value)
}

/**
 * Headless picker model and color-specific part surfaces. Compose ListboxRoot,
 * ListboxContent, ListboxItem and ListboxItemIndicator for collection registration,
 * selection interactions, roving focus, keyboard navigation and indicator presence.
 *
 * Values are `string | Color` and are compared structurally, so a hex model selects
 * the item declared with the equivalent `Color` and vice versa.
 *
 * @experimental
 * @lifecycle pure
 */
export function useColorSwatchPicker(props: UseColorSwatchPickerProps = {}): UseColorSwatchPickerReturn {
  const multiple = computed(() => toValue(props.multiple) ?? false)
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<ColorSwatchPickerModelValue, ColorSwatchPickerChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? (multiple.value ? [] : ''),
    isEqual: isSameModel,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  function setValue(value: ColorSwatchPickerModelValue, reason: ColorSwatchPickerChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  function select(value: ColorSwatchPickerValue, event?: Event) {
    if (disabled.value)
      return false
    const toggle = toValue(props.selectionBehavior) !== 'replace'
    if (multiple.value) {
      const values = Array.isArray(modelValue.value) ? modelValue.value : []
      const selected = values.some(v => isSameSwatchColor(v, value))
      return setValue(toggle ? selected ? values.filter(v => !isSameSwatchColor(v, value)) : [...values, value] : [value], 'selection', event)
    }
    return setValue(toggle && isSameSwatchColor(modelValue.value as ColorSwatchPickerValue | undefined, value) ? undefined : value, 'selection', event)
  }

  const listboxProps = computed(() => ({
    'modelValue': modelValue.value,
    'multiple': multiple.value,
    'disabled': disabled.value,
    'selectionBehavior': toValue(props.selectionBehavior) ?? 'toggle',
    'by': isSameSwatchColor,
    'onUpdate:modelValue': (value: ColorSwatchPickerModelValue) => setValue(value, 'selection'),
  }))
  const root = createPartSurface<ColorSwatchPickerRootState>(() => ({
    'role': 'listbox',
    'aria-disabled': disabled.value || undefined,
    'aria-multiselectable': multiple.value || undefined,
  }), () => ({}))

  return {
    modelValue,
    multiple,
    disabled,
    setValue,
    select,
    lastChangeDetails,
    isControlled,
    root,
    listboxProps,
    getItemSurface: getColorSwatchPickerItemSurface,
    getItemSwatchSurface: (color: MaybeRefOrGetter<ColorSwatchPickerValue>) => getColorSwatchPickerItemSwatchSurface({ color: computed(() => toValue(color)) }),
    itemIndicator: getColorSwatchPickerItemIndicatorSurface(),
  }
}

/**
 * Context-pure color metadata, layered over ListboxItem.
 * @internal
 */
export function getColorSwatchPickerItemSurface(value: MaybeRefOrGetter<ColorSwatchPickerValue>) {
  const cssColor = computed(() => toCssColor(toValue(value)))
  const colorLabel = computed(() => {
    try {
      return getColorName(cssColor.value)
    }
    catch {
      return cssColor.value
    }
  })
  return createPartSurface<ColorSwatchPickerItemState>(() => ({
    'aria-label': colorLabel.value,
    'style': { '--reka-color-swatch-picker-item-color': cssColor.value },
  }), () => ({ color: cssColor.value }))
}

/**
 * Forward the item color; ColorSwatch owns styling and accessibility.
 * @internal
 */
export function getColorSwatchPickerItemSwatchSurface(context: ColorSwatchPickerItemContext) {
  return createPartSurface<ColorSwatchPickerItemSwatchState>(() => ({ color: context.color.value }), () => ({}))
}

/**
 * Selection and presence are supplied by ListboxItemIndicator.
 * @internal
 */
export function getColorSwatchPickerItemIndicatorSurface() {
  return createPartSurface<ColorSwatchPickerItemIndicatorState>(() => ({}), () => ({}))
}
