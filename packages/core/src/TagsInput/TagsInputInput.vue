<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useComposing, useForwardExpose } from '@/shared'

export interface TagsInputInputProps extends PrimitiveProps {
  /** The placeholder character to use for empty tags input. */
  placeholder?: string
  /** Focus on element when mounted. */
  autoFocus?: boolean
  /** Maximum number of character allowed. */
  maxLength?: number
}
</script>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'

const props = withDefaults(defineProps<TagsInputInputProps>(), {
  as: 'input',
})

const context = injectTagsInputRootContext()
const { forwardRef, currentElement } = useForwardExpose()

function handleBlur(event: FocusEvent) {
  context.selectedElement.value = undefined

  if (!context.addOnBlur.value)
    return

  const target = event.target as HTMLInputElement

  // If the blur is caused by clicking an option within the content,
  // we don't trigger the `addOnBlur` action,
  // because the clicked option should be added instead of the input's current value.
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const controlledId = target.getAttribute('aria-controls')
  if (controlledId && relatedTarget?.closest(`#${CSS.escape(controlledId)}`))
    return

  if (!target.value)
    return

  const isAdded = context.onAddValue(target.value)
  if (isAdded)
    target.value = ''
}

function handleTab(event: KeyboardEvent) {
  if (!context.addOnTab.value)
    return

  return handleCustomKeydown(event)
}

function handleEnter(event: KeyboardEvent) {
  return handleCustomKeydown(event, { preventImplicitSubmit: true })
}

const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing()
async function handleCustomKeydown(event: KeyboardEvent, { preventImplicitSubmit = false } = {}) {
  if (isComposing.value)
    return

  // If keydown `Enter` or `Tab` was prevented, we let user handle updating the value themselves.
  // Listeners that run after this one (e.g. `@keydown.enter.prevent`, or a wrapping `ComboboxInput`
  // selecting its highlighted item) can only be observed after dispatch, and by then
  // `defaultPrevented` may already be set by us, so their `preventDefault()` calls are tracked here.
  let isPreventedByOthers = event.defaultPrevented
  const nativePreventDefault = event.preventDefault.bind(event)
  event.preventDefault = () => {
    isPreventedByOthers = true
    nativePreventDefault()
  }

  const target = event.target as HTMLInputElement
  // A form submits implicitly as soon as the `Enter` keydown dispatch finishes,
  // so it has to be cancelled synchronously. An empty draft keeps submitting the form.
  if (preventImplicitSubmit && target.value && !isPreventedByOthers)
    nativePreventDefault()

  await nextTick()
  if (isPreventedByOthers)
    return

  if (!target.value)
    return

  const isAdded = context.onAddValue(target.value)
  if (isAdded)
    target.value = ''
}

function handleInput(event: InputEvent) {
  if (isComposing.value)
    return
  context.isInvalidInput.value = false
  if (event.data === null)
    return

  const delimiter = context.delimiter.value
  const matchesDelimiter = delimiter === event.data || (delimiter instanceof RegExp && delimiter.test(event.data))
  if (matchesDelimiter) {
    const target = event.target as HTMLInputElement
    target.value = target.value.replace(delimiter, '')

    if (target.value.trim() === '') {
      target.value = ''
      return
    }

    const isAdded = context.onAddValue(target.value)
    if (isAdded)
      target.value = ''
  }
}

function handleInputKeydown(event: KeyboardEvent) {
  // `isComposing` stays true until the tick after `compositionend`, so arrow/backspace
  // tag navigation is skipped even when the commit keydown reports `event.isComposing === false`.
  if (isComposing.value)
    return
  context.onInputKeydown(event)
}

function handlePaste(event: ClipboardEvent) {
  if (context.addOnPaste.value) {
    event.preventDefault()
    const clipboardData = event.clipboardData
    if (!clipboardData)
      return

    const value = clipboardData.getData('text')
    if (context.delimiter.value) {
      const splitValue = value.split(context.delimiter.value)
      splitValue.forEach((v) => {
        context.onAddValue(v)
      })
    }
    else {
      context.onAddValue(value)
    }
  }
}

onMounted(() => {
  const inputEl = currentElement.value.nodeName === 'INPUT'
    ? currentElement.value
    : currentElement.value.querySelector('input')

  if (!inputEl)
    return

  setTimeout(() => {
    // make sure all DOM was flush then only capture the focus
    if (props.autoFocus)
      inputEl?.focus()
  }, 1)
})
</script>

<template>
  <Primitive
    :id="context.id?.value"
    :ref="forwardRef"
    type="text"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    :as="as"
    :as-child="asChild"
    :maxlength="maxLength"
    :placeholder="placeholder"
    :disabled="context.disabled.value"
    :data-invalid="context.isInvalidInput.value ? '' : undefined"
    @input="handleInput"
    @keydown.enter="handleEnter"
    @keydown.tab="handleTab"
    @blur="handleBlur"
    @keydown="handleInputKeydown"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
    @paste="handlePaste"
  >
    <slot />
  </Primitive>
</template>
