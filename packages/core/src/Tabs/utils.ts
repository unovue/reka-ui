import type { Ref } from 'vue'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import type { StringOrNumber } from '@/shared/types'
import { computed, onBeforeUnmount, watch } from 'vue'
import { useTriggerId } from '@/shared'
import { useSelectorKey } from '@/shared/createKeyedSelector'

export function makeTriggerId(baseId: string, value: StringOrNumber) {
  return `${baseId}-trigger-${value}`
}

export function makeContentId(baseId: string, value: StringOrNumber) {
  return `${baseId}-content-${value}`
}

/**
 * Resolves the id a trigger or a content renders. Only an id that differs from the
 * generated one (a consumer `id`, or the id kept from the server render) is registered
 * in `ids`, under the part's current tab value.
 */
export function useTabsPartId(
  ids: Ref<Map<StringOrNumber, string>>,
  props: { value: StringOrNumber },
  element: Readonly<Ref<HTMLElement | undefined>>,
  generate: () => string,
) {
  const partId = computed(() => ids.value.get(props.value) ?? generate())
  let registeredValue: StringOrNumber | undefined
  useTriggerId({
    get triggerId() {
      return partId.value
    },
    set triggerId(id) {
      if (registeredValue !== undefined && registeredValue !== props.value)
        ids.value.delete(registeredValue)
      registeredValue = props.value
      ids.value.set(props.value, id)
    },
  }, element)
  watch(() => props.value, (value) => {
    if (registeredValue === undefined || registeredValue === value)
      return
    const id = ids.value.get(registeredValue)
    ids.value.delete(registeredValue)
    registeredValue = value
    if (id)
      ids.value.set(value, id)
  }, { flush: 'sync' })
  onBeforeUnmount(() => {
    if (registeredValue !== undefined)
      ids.value.delete(registeredValue)
  })
  return partId
}

/**
 * Whether the part's tab is the selected one: `value === modelValue`, read so that the part
 * re-renders only when its own tab is entered or left.
 *
 * The keyed selector matches like a `Map` does, which differs from `===` for two kinds of value: it
 * never matches `null` or `undefined`, and it matches `NaN` with `NaN`. Those are compared with the
 * model directly.
 */
export function useTabSelected(
  context: { selection: KeyedSelector<StringOrNumber>, modelValue: Ref<StringOrNumber | undefined> },
  getValue: () => StringOrNumber,
) {
  const isHeld = useSelectorKey(context.selection, getValue)
  return () => {
    const value = getValue()
    // Read first: it also moves what the part holds in the selector to its current value.
    const held = isHeld()
    if (value == null)
      return value === context.modelValue.value
    // eslint-disable-next-line no-self-compare -- `NaN` is never equal to the model, not even to `NaN`
    return value === value && held
  }
}
