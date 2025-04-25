<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { Direction } from '@/shared/types'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useDirection, useFormControl, useForwardExpose } from '@/shared'
import { createCollection } from '@/Collection'

export type AcceptableValue = string | number | boolean | Record<string, any>
type ArrayOrWrapped<T> = T extends any[] ? T : Array<T>

type ComboboxRootContext<T> = {
  modelValue: Ref<T | Array<T>>
  onValueChange: (val: T) => void
  searchTerm: Ref<string>
  multiple: Ref<boolean>
  disabled: Ref<boolean>
  open: Ref<boolean>
  onOpenChange: (value: boolean) => void
  isUserInputted: Ref<boolean>
  filteredOptions: Ref<Array<T>>
  contentId: string
  contentElement: Ref<HTMLElement | undefined>
  onContentElementChange: (el: HTMLElement) => void
  inputElement: Ref<HTMLInputElement | undefined>
  onInputElementChange: (el: HTMLInputElement) => void
  onInputNavigation: (dir: 'up' | 'down' | 'home' | 'end') => void
  onInputEnter: (event: InputEvent) => void
  onCompositionStart: () => void
  onCompositionEnd: () => void
  selectedValue: Ref<T | undefined>
  selectedElement: ComputedRef<HTMLElement | undefined>
  onSelectedValueChange: (val: T) => void
  parentElement: Ref<HTMLElement | undefined>
}

export const [injectComboboxRootContext, provideComboboxRootContext]
  = createContext<ComboboxRootContext<AcceptableValue>>('ComboboxRoot')

export type ComboboxRootEmits<T = AcceptableValue> = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: T]
  /** Event handler called when the open state of the combobox changes. */
  'update:open': [value: boolean]
  /** Event handler called when the searchTerm of the combobox changes. */
  'update:searchTerm': [value: string]
  /** Event handler called when the highlighted value of the combobox changes */
  'update:selectedValue': [value: T | undefined]
}

export interface ComboboxRootProps<T = AcceptableValue> extends PrimitiveProps {
  /** The controlled value of the Combobox. Can be binded with with `v-model`. */
  modelValue?: T | Array<T>
  /** The value of the combobox when initially rendered. Use when you do not need to control the state of the Combobox */
  defaultValue?: T | Array<T>
  /** The controlled open state of the Combobox. Can be binded with with `v-model:open`. */
  open?: boolean
  /** The open state of the combobox when it is initially rendered. <br> Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** The controlled search term of the Combobox. Can be binded with with v-model:searchTerm. */
  searchTerm?: string
  /** The current highlighted value of the COmbobox. Can be binded with `v-model:selectedValue`. */
  selectedValue?: T
  /** Whether multiple options can be selected or not. */
  multiple?: boolean
  /** When `true`, prevents the user from interacting with Combobox */
  disabled?: boolean
  /** The name of the Combobox. Submitted with its owning form as part of a name/value pair. */
  name?: string
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** The custom filter function for filtering `ComboboxItem`. */
  filterFunction?: (val: ArrayOrWrapped<T>, term: string) => ArrayOrWrapped<T>
  /** Custom function for handling combobox input enter event that preserves native event. */
  inputEnterFunction?: (event: InputEvent, selectedValue: T | undefined) => void
  /** The display value of input for selected item. Does not work with `multiple`. */
  displayValue?: (val: T) => string
  /**
   * Whether to reset the searchTerm when the Combobox input blurred
   * @defaultValue `true`
   */
  resetSearchTermOnBlur?: boolean
  /**
   * Whether to reset the searchTerm when the Combobox value is selected
   * @defaultValue `true`
   */
  resetSearchTermOnSelect?: boolean
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import { PopperRoot } from '@/Popper'
import { Primitive } from '@/Primitive'
import { useVModel } from '@vueuse/core'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import isEqual from 'fast-deep-equal'

const props = withDefaults(defineProps<ComboboxRootProps<T>>(), {
  open: undefined,
  resetSearchTermOnBlur: true,
  resetSearchTermOnSelect: true,
})
const emit = defineEmits<ComboboxRootEmits<T>>()

defineSlots<{
  default: (props: {
    /** Current open state */
    open: typeof open.value
    /** Current active value */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { multiple, disabled, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

const searchTerm = useVModel(props, 'searchTerm', emit, {
  // @ts-expect-error ignore the type error here
  defaultValue: '',
  passive: (props.searchTerm === undefined) as false,
}) as Ref<string>

const modelValue = useVModel(props, 'modelValue', emit, {
  // @ts-expect-error ignore the type error here
  defaultValue: props.defaultValue ?? multiple.value ? [] : undefined,
  passive: (props.modelValue === undefined) as false,
  deep: true,
}) as Ref<T | T[]>

const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const selectedValue = useVModel(props, 'selectedValue', emit, {
  defaultValue: undefined,
  passive: (props.selectedValue === undefined) as false,
}) as Ref<T | undefined>

async function onOpenChange(val: boolean) {
  open.value = val
  await nextTick()
  if (val) {
    if (modelValue.value) {
      if (Array.isArray(modelValue.value) && multiple.value)
        selectedValue.value = (getItems().find(i => (i.ref)?.dataset?.state === 'checked'))?.value
      else
        selectedValue.value = modelValue.value as T
    }
    // selectedElement is a computed value and is not yet fully resolved.
    // We need to wait for it to finish processing at this point.
    await nextTick()
    inputElement.value?.focus()
    scrollSelectedValueIntoView()
  }
  else {
    isUserInputted.value = false
    if (props.resetSearchTermOnBlur)
      resetSearchTerm('blur')
  }
}

function onValueChange(val: T) {
  if (Array.isArray(modelValue.value) && multiple.value) {
    const index = modelValue.value.findIndex(i => isEqual(i, val))
    const modelArray = [...modelValue.value]
    index === -1 ? modelArray.push(val) : modelArray.splice(index, 1)
    modelValue.value = modelArray
  }
  else {
    modelValue.value = val
    onOpenChange(false)
  }
}

const isUserInputted = ref(false)

const inputElement = ref<HTMLInputElement>()
const contentElement = ref<HTMLElement>()
const { forwardRef, currentElement: parentElement } = useForwardExpose()
const { getItems, reactiveItems, itemMapSize } = createCollection<{ value: T }>('data-radix-vue-combobox-item')

const options = ref<T[]>([]) as Ref<T[]>

watch(() => itemMapSize.value, () => {
  options.value = getItems().map(i => i.value)
}, {
  immediate: true,
  flush: 'post',
})

const filteredOptions = computed(() => {
  if (isUserInputted.value) {
    if (props.filterFunction)
      return props.filterFunction(options.value as ArrayOrWrapped<T>, searchTerm.value) as T[]

    // The default filter only compares strings
    const optionsWithTypeString = options.value.filter(i => typeof i === 'string') as string[]
    if (optionsWithTypeString.length)
      return optionsWithTypeString.filter(i => i.toLowerCase().includes(searchTerm.value?.toLowerCase())) as T[]
  }
  return options.value
})

function resetSearchTerm(mode?: 'blur' | 'select') {
  // clear when blur or when select and resetSearchTermOnSelect is true
  const condition = mode === 'blur' || (mode === 'select' && props.resetSearchTermOnSelect)

  if (!multiple.value && modelValue.value && !Array.isArray(modelValue.value)) {
    if (props.displayValue)
      searchTerm.value = props.displayValue(modelValue.value)
    else if (typeof modelValue.value !== 'object')
      searchTerm.value = modelValue.value.toString()
    else if (condition)
      searchTerm.value = ''
  }
  else if (condition) {
    searchTerm.value = ''
  }
}

const activeIndex = computed(() => filteredOptions.value.findIndex(i => isEqual(i, selectedValue.value)))
const selectedElement = computed(() => {
  return reactiveItems.value.find(i => isEqual(i.value, selectedValue.value))?.ref
})

const stringifiedModelValue = computed(() => JSON.stringify(modelValue.value))

// nextTick() are required in the following watchers as we are waiting for DOM element to be mounted first the only apply following logic
watch(stringifiedModelValue, async () => {
  await nextTick()
  await nextTick()
  resetSearchTerm('select')
}, {
  // If searchTerm is provided with value during initialization, we don't reset it immediately
  immediate: !props.searchTerm,
})

watch(() => [filteredOptions.value.length, searchTerm.value.length], async ([length, searchTermLength], [oldLength, oldSearchTermLength]) => {
  await nextTick()
  await nextTick()
  if (length && (oldSearchTermLength > searchTermLength || activeIndex.value === -1))
    selectedValue.value = filteredOptions.value[0]
})

const isFormControl = useFormControl(parentElement)

function scrollSelectedValueIntoView() {
  // Find the highlighted element and scroll into view
  // We can put this in Item, but we avoid having too many watcher
  if (selectedElement.value instanceof Element)
    selectedElement.value?.scrollIntoView({ block: 'nearest' })
}

function focusOnSelectedElement() {
  // Find the highlighted element and focus
  // This helps the screen readers to read the selected value
  if (selectedElement.value instanceof Element && selectedElement.value.focus)
    selectedElement.value.focus()
}

const isComposing = ref(false)
function onCompositionStart() {
  isComposing.value = true
}
function onCompositionEnd() {
  requestAnimationFrame(() => {
    isComposing.value = false
  })
}
async function onInputEnter(event: InputEvent) {
  if (props.inputEnterFunction) {
    props.inputEnterFunction(event, selectedValue.value)
    return
  }

  if (filteredOptions.value.length && selectedValue.value && selectedElement.value instanceof Element) {
    event.preventDefault()
    event.stopPropagation()
    if (!isComposing.value)
      selectedElement.value?.click()
  }
}

provideComboboxRootContext({
  searchTerm,
  modelValue,
  // @ts-expect-error ignoring
  onValueChange,
  isUserInputted,
  multiple,
  disabled,
  open,
  onOpenChange,
  filteredOptions,
  contentId: '',
  inputElement,
  selectedElement,
  onInputElementChange: val => inputElement.value = val,
  onInputNavigation: async (val) => {
    const index = activeIndex.value

    if ((index === 0 && val === 'up') || (index === (filteredOptions.value.length - 1) && val === 'down'))
      return

    if ((index === -1 && filteredOptions.value.length) || val === 'home')
      selectedValue.value = filteredOptions.value[0]

    else if (val === 'end')
      selectedValue.value = filteredOptions.value[filteredOptions.value.length - 1]

    else
      selectedValue.value = filteredOptions.value[val === 'up' ? index - 1 : index + 1]

    await nextTick()
    // selectedElement is a computed value and is not yet fully resolved.
    // We need to wait for it to finish processing at this point.
    scrollSelectedValueIntoView()
    focusOnSelectedElement()

    nextTick(() => inputElement.value?.focus({ preventScroll: true }))
  },
  onInputEnter,
  onCompositionEnd,
  onCompositionStart,
  selectedValue,
  onSelectedValueChange: val => selectedValue.value = val as T,
  parentElement,
  contentElement,
  onContentElementChange: val => contentElement.value = val,
})
</script>

<template>
  <PopperRoot>
    <Primitive
      :ref="forwardRef"
      :style="{
        pointerEvents: open ? 'auto' : undefined,
      }"
      :as="as"
      :as-child="asChild"
      :dir="dir"
      v-bind="$attrs"
    >
      <slot
        :open="open"
        :model-value="modelValue"
      />

      <VisuallyHiddenInput
        v-if="isFormControl && props.name"
        :name="props.name"
        :value="modelValue"
      />
    </Primitive>
  </PopperRoot>
</template>
