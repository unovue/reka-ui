<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onMounted, ref, watch } from 'vue'
import { getActiveElement, useComposing, useKbd } from '@/shared'
import { injectNumberFieldRootContext } from './NumberFieldRoot.vue'

export interface NumberFieldInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { Primitive, usePrimitiveElement } from '@/Primitive'

const props = withDefaults(defineProps<NumberFieldInputProps>(), {
  as: 'input',
})

const { primitiveElement, currentElement } = usePrimitiveElement()
const rootContext = injectNumberFieldRootContext()
const kbd = useKbd()
const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing()

function handleKeydown(event: KeyboardEvent) {
  // Don't step/apply mid-composition, keys are used for IME candidate navigation and commit.
  // `isComposing` stays true until the tick after `compositionend`, so the commit keydown
  // (which can report `event.isComposing === false`) is still skipped.
  if (isComposing.value || event.isComposing)
    return

  switch (event.key) {
    case kbd.ARROW_UP:
      event.preventDefault()
      rootContext.handleIncrease()
      break
    case kbd.ARROW_DOWN:
      event.preventDefault()
      rootContext.handleDecrease()
      break
    case kbd.PAGE_UP:
      event.preventDefault()
      rootContext.handleIncrease(10)
      break
    case kbd.PAGE_DOWN:
      event.preventDefault()
      rootContext.handleDecrease(10)
      break
    case kbd.HOME:
      event.preventDefault()
      rootContext.handleMinMaxValue('min')
      break
    case kbd.END:
      event.preventDefault()
      rootContext.handleMinMaxValue('max')
      break
    case kbd.ENTER:
      rootContext.applyInputValue((event.target as HTMLInputElement)?.value)
      break
  }
}

function handleWheelEvent(event: WheelEvent) {
  if (rootContext.disableWheelChange.value)
    return

  // only handle when in focus
  if (event.target !== getActiveElement())
    return

  // if on a trackpad, users can scroll in both X and Y at once, check the magnitude of the change
  // if it's mostly in the X direction, then just return, the user probably doesn't mean to inc/dec
  // this isn't perfect, events come in fast with small deltas and a part of the scroll may give a false indication
  // especially if the user is scrolling near 45deg
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX))
    return

  event.preventDefault()
  if (event.deltaY > 0)
    rootContext.invertWheelChange.value ? rootContext.handleDecrease() : rootContext.handleIncrease()
  else if (event.deltaY < 0)
    rootContext.invertWheelChange.value ? rootContext.handleIncrease() : rootContext.handleDecrease()
}

onMounted(() => {
  rootContext.onInputElement(currentElement.value as HTMLInputElement)
})

const inputValue = ref(rootContext.textValue.value)
watch(() => rootContext.textValue.value, () => {
  inputValue.value = rootContext.textValue.value
}, { immediate: true, deep: true })

function handleChange() {
  requestAnimationFrame(() => {
    inputValue.value = rootContext.textValue.value
  })
}
</script>

<template>
  <Primitive
    v-bind="props"
    :id="rootContext.id.value"
    ref="primitiveElement"
    :value="inputValue"
    role="spinbutton"
    type="text"
    tabindex="0"
    :inputmode="rootContext.inputMode.value"
    :disabled="rootContext.disabled.value ? '' : undefined"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    :readonly="rootContext.readonly.value ? '' : undefined"
    :data-readonly="rootContext.readonly.value ? '' : undefined"
    autocomplete="off"
    autocorrect="off"
    spellcheck="false"
    aria-roledescription="Number field"
    :aria-valuenow="rootContext.modelValue.value"
    :aria-valuemin="rootContext.min.value"
    :aria-valuemax="rootContext.max.value"
    @keydown="handleKeydown"
    @wheel="handleWheelEvent"
    @beforeinput="(event: InputEvent) => {
      if (event.isComposing) return
      const target = event.target as HTMLInputElement
      let nextValue
        = target.value.slice(0, target.selectionStart ?? undefined)
          + (event.data ?? '')
          + target.value.slice(target.selectionEnd ?? undefined);

      // validate
      if (!rootContext.validate(nextValue))
        event.preventDefault()
    }"
    @input="(event: InputEvent) => {
      const target = event.target as HTMLInputElement
      inputValue = target.value
    }"
    @change="handleChange"
    @blur="rootContext.applyInputValue($event.target?.value)"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
  >
    <slot />
  </Primitive>
</template>
