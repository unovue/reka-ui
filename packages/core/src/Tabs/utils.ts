import type { Ref } from 'vue'
import type { StringOrNumber } from '@/shared/types'
import { computed, onBeforeUnmount, watch } from 'vue'
import { useTriggerId } from '@/shared'

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
