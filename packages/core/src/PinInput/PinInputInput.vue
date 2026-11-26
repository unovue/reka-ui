<script lang="ts">
import type { PinInputContextValue } from './PinInputRoot.vue'
import type { PrimitiveProps } from '@/Primitive'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { disabledAttr, getActiveElement, useArrowNavigation, useComposing, useTranslations } from '@/shared'
import { injectPinInputRootContext } from './PinInputRoot.vue'

export interface PinInputInputProps extends PrimitiveProps {
  /** Position of the value this input binds to. */
  index: number
  /** When `true`, prevents the user from interacting with the pin input */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'

const props = withDefaults(defineProps<PinInputInputProps>(), {
  as: 'input',
})

const t = useTranslations()

const context = injectPinInputRootContext()
const inputElements = computed(() => [...context.inputElements!.value])
const currentValue = computed(() => context.currentModelValue.value[props.index])

const disabled = computed(() => props.disabled || context.disabled.value)
const isOtpMode = computed(() => context.otp.value)
const isPasswordMode = computed(() => context.mask.value)

const NUMBER_REG = /^\d*$/
const NON_NUMBER_REG = /\D/g

const { primitiveElement, currentElement } = usePrimitiveElement()

const mountedPosition = computed(() => inputElements.value.indexOf(currentElement.value as HTMLInputElement))
function focusNextInput() {
  const position = mountedPosition.value
  if (position >= 0)
    inputElements.value[position + 1]?.focus()
}

const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing((event) => {
  const target = event.target as HTMLInputElement
  const value = event.data || target.value

  if (context.isNumericMode.value) {
    const filtered = value.replace(NON_NUMBER_REG, '')
    if (!filtered) {
      target.value = ''
      return
    }
    if (filtered.length > 1) {
      handleMultipleCharacter(filtered)
      return
    }
    target.value = filtered
    updateModelValueAt(props.index, filtered)
    focusNextInput()
    return
  }

  if (value.length > 1) {
    handleMultipleCharacter(value)
    return
  }

  target.value = value
  updateModelValueAt(props.index, value)

  focusNextInput()
})

function handleInput(event: InputEvent) {
  if (isComposing.value || event.isComposing)
    return
  const target = event.target as HTMLInputElement

  if ((event.data?.length ?? 0) > 1) {
    handleMultipleCharacter(target.value)
    return
  }

  if (context.isNumericMode.value && !NUMBER_REG.test(target.value)) {
    target.value = target.value.replace(NON_NUMBER_REG, '')
    return
  }

  target.value = event.data || target.value.slice(-1)
  updateModelValueAt(props.index, target.value)

  focusNextInput()
}

function updatePlaceholder() {
  nextTick(() => {
    const target = currentElement.value as HTMLInputElement
    if (!target) {
      return
    }
    if (!target.value && target === getActiveElement()) {
      target.placeholder = ''
    }
    else {
      target.placeholder = context.placeholder.value
    }
  })
}

function handleKeydown(event: KeyboardEvent) {
  // Don't move between inputs mid-composition, arrow keys are used for IME candidate navigation
  if (isComposing.value || event.isComposing)
    return
  // In OTP mode, arrow keys must not move past the first empty input
  const firstEmptyInputIdx = getFirstEmptyInputIndex()
  const itemsArray = firstEmptyInputIdx === -1
    ? inputElements.value
    : inputElements.value.slice(0, firstEmptyInputIdx + 1)
  useArrowNavigation(event, getActiveElement() as HTMLElement, undefined, {
    itemsArray,
    focus: true,
    loop: false,
    arrowKeyOptions: 'horizontal',
    dir: context.dir.value,
  })
}

function handleBackspace(event: KeyboardEvent) {
  event.preventDefault()
  const target = event.target as HTMLInputElement
  const value = target.value

  if (value) {
    updateModelValueAt(props.index, '')
  }
  else {
    const previousPosition = mountedPosition.value - 1
    const prevEl = inputElements.value[previousPosition]
    if (prevEl) {
      prevEl.focus()
      updateModelValueAt(context.getModelIndex(prevEl, previousPosition), '')
    }
  }
}

function handleDelete(event: KeyboardEvent) {
  if (event.key === 'Delete') {
    event.preventDefault()
    updateModelValueAt(props.index, '')
  }
}

/**
 * In OTP mode, inputs should be filled one by one without skipping middle inputs.
 * Returns the index of the first empty input, or `-1` when not in OTP mode / all filled.
 */
function getFirstEmptyInputIndex() {
  if (!context.otp.value)
    return -1
  return inputElements.value.findIndex((input, position) => {
    const value = context.currentModelValue.value[context.getModelIndex(input, position)]
    return value === '' || value === undefined
  })
}

function getEarlierEmptyInput() {
  const firstEmptyInputIdx = getFirstEmptyInputIndex()
  if (firstEmptyInputIdx !== -1 && firstEmptyInputIdx < mountedPosition.value)
    return inputElements.value[firstEmptyInputIdx]
  return undefined
}

function handleMousedown(event: MouseEvent) {
  const earlierEmptyInput = getEarlierEmptyInput()
  if (!earlierEmptyInput)
    return
  // Prevent this input from receiving focus and send it to the first empty one instead
  event.preventDefault()
  earlierEmptyInput.focus()
}

function handleFocus(event: FocusEvent) {
  // Focus arriving from a sibling input (e.g. `Tab`) must not be redirected,
  // otherwise keyboard users get trapped inside the pin input (#2943)
  const isFromSiblingInput = inputElements.value.includes(event.relatedTarget as HTMLInputElement)
  if (!isFromSiblingInput) {
    const earlierEmptyInput = getEarlierEmptyInput()
    if (earlierEmptyInput) {
      earlierEmptyInput.focus()
      return
    }
  }

  const target = event.target as HTMLInputElement
  target.setSelectionRange(1, 1)
  updatePlaceholder()
}

function handleBlur(event: FocusEvent) {
  updatePlaceholder()
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const clipboardData = event.clipboardData
  if (!clipboardData)
    return

  const rawValues = clipboardData.getData('text')
  const values = context.isNumericMode.value
    ? rawValues.replace(NON_NUMBER_REG, '')
    : rawValues
  handleMultipleCharacter(values)
}

function handleMultipleCharacter(values: string) {
  const tempModelValue = [...context.currentModelValue.value] as typeof context.currentModelValue.value
  const initialIndex = values.length >= inputElements.value.length ? 0 : mountedPosition.value
  if (initialIndex < 0)
    return
  const lastIndex = Math.min(initialIndex + values.length, inputElements.value.length)
  for (let i = initialIndex; i < lastIndex; i++) {
    const input = inputElements.value[i]
    const modelIndex = context.getModelIndex(input, i)
    const value = values[i - initialIndex]
    if (context.isNumericMode.value) {
      const num = Number.parseInt(value)
      if (Number.isNaN(num))
        continue
      tempModelValue[modelIndex] = num
    }
    else {
      tempModelValue[modelIndex] = value
    }
    input.focus()
  }
  context.modelValue.value = tempModelValue
  inputElements.value[lastIndex]?.focus()
}

function removeTrailingEmptyStrings(input: PinInputContextValue<typeof context.type.value>) {
  let i = input.length - 1

  while (i >= 0 && input[i] === '') {
    input.pop()
    i--
  }

  return input
}

function updateModelValueAt(index: number, value: string) {
  const tempModelValue = [...context.currentModelValue.value] as typeof context.currentModelValue.value

  if (context.isNumericMode.value) {
    const num = +value

    if (value === '' || isNaN(num)) {
      tempModelValue[index] = undefined
    }
    else {
      tempModelValue[index] = num
    }
  }
  else {
    tempModelValue[index] = value
  }

  context.modelValue.value = removeTrailingEmptyStrings(tempModelValue)
}

watch(currentValue, updatePlaceholder)

watch([currentElement, () => props.index], ([element], _, onCleanup) => {
  if (!element)
    return
  const input = element as HTMLInputElement
  context.onInputElementChange(input, props.index)
  onCleanup(() => context.inputElements?.value.delete(input))
}, { flush: 'post' })
</script>

<template>
  <Primitive
    ref="primitiveElement"
    autocapitalize="none"
    :as="as"
    :as-child="asChild"
    :autocomplete="isOtpMode ? 'one-time-code' : 'off'"
    :type="isPasswordMode ? 'password' : 'text'"
    :inputmode="context.isNumericMode.value ? 'numeric' : 'text'"
    :pattern="context.isNumericMode.value ? '[0-9]*' : undefined"
    :placeholder="context.placeholder.value"
    :value="currentValue"
    :disabled="disabledAttr(disabled, props.as, props.asChild)"
    :data-disabled="disabled ? '' : undefined"
    :data-complete="context.isCompleted.value ? '' : undefined"
    data-reka-pin-input=""
    :aria-label="mountedPosition < 0 ? t('pinInputLabel') : t('pinInputLabelIndexed', { index: mountedPosition + 1, total: inputElements.length })"
    @input="handleInput($event as InputEvent)"
    @keydown.left.right.up.down.home.end="handleKeydown"
    @keydown.backspace="handleBackspace"
    @keydown.delete="handleDelete"
    @mousedown="handleMousedown"
    @focus="handleFocus"
    @blur="handleBlur"
    @paste="handlePaste"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
  >
    <slot />
  </Primitive>
</template>
