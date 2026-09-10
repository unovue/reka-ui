import type { MaybeRefOrGetter } from 'vue'
import type { ColorSwatchPickerItemContext } from './ColorSwatchPickerItem.vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { computed, toValue } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { getColorName } from '@/shared/color'

export type ColorSwatchPickerChangeReason = 'selection'
export type ColorSwatchPickerRootState = Record<string, never>
export type ColorSwatchPickerItemState = { color: string }
export type ColorSwatchPickerItemIndicatorState = Record<string, never>
export type ColorSwatchPickerItemSwatchState = Record<string, never>

export interface UseColorSwatchPickerProps {
  modelValue?: MaybeRefOrGetter<string | string[] | undefined>
  defaultValue?: MaybeRefOrGetter<string | string[] | undefined>
  multiple?: MaybeRefOrGetter<boolean | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  selectionBehavior?: MaybeRefOrGetter<'toggle' | 'replace' | undefined>
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: string | string[] | undefined, details: ChangeEventDetails<ColorSwatchPickerChangeReason>) => void
  onUpdate?: (value: string | string[] | undefined, details: ChangeEventDetails<ColorSwatchPickerChangeReason>) => void
}

export type UseColorSwatchPickerReturn = ReturnType<typeof useColorSwatchPicker>

/**
 * Headless picker model and color-specific part surfaces. Compose ListboxRoot,
 * ListboxContent, ListboxItem and ListboxItemIndicator for collection registration,
 * selection interactions, roving focus, keyboard navigation and indicator presence.
 * @experimental
 * @lifecycle pure
 */
export function useColorSwatchPicker(props: UseColorSwatchPickerProps = {}) {
  const multiple = computed(() => toValue(props.multiple) ?? false)
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | string[] | undefined, ColorSwatchPickerChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? (multiple.value ? [] : ''),
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  function setValue(value: string | string[] | undefined, reason: ColorSwatchPickerChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  function select(value: string, event?: Event) {
    if (disabled.value)
      return false
    const toggle = toValue(props.selectionBehavior) !== 'replace'
    if (multiple.value) {
      const values = Array.isArray(modelValue.value) ? modelValue.value : []
      return setValue(toggle ? values.includes(value) ? values.filter(v => v !== value) : [...values, value] : [value], 'selection', event)
    }
    return setValue(toggle && modelValue.value === value ? undefined : value, 'selection', event)
  }

  const root = createPartSurface<ColorSwatchPickerRootState>(() => ({
    'modelValue': modelValue.value,
    'multiple': multiple.value,
    'disabled': disabled.value,
    'selectionBehavior': toValue(props.selectionBehavior) ?? 'toggle',
    'onUpdate:modelValue': (value: string | string[] | undefined) => setValue(value, 'selection'),
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
    getItemSurface: getColorSwatchPickerItemSurface,
    getItemSwatchSurface: (color: MaybeRefOrGetter<string>) => getColorSwatchPickerItemSwatchSurface({ color: computed(() => toValue(color)) }),
    itemIndicator: getColorSwatchPickerItemIndicatorSurface(),
  }
}

/**
 * Context-pure color metadata, layered over ListboxItem.
 * @internal
 */
export function getColorSwatchPickerItemSurface(value: MaybeRefOrGetter<string>) {
  const colorLabel = computed(() => {
    try {
      return getColorName(toValue(value))
    }
    catch {
      return toValue(value)
    }
  })
  return createPartSurface<ColorSwatchPickerItemState>(() => ({
    'aria-label': colorLabel.value,
    'style': { '--reka-color-swatch-picker-item-color': toValue(value) },
  }), () => ({ color: toValue(value) }))
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
