<script lang="ts">
import { Primitive, type PrimitiveProps } from '@/Primitive'
import type { SegmentPart } from '@/shared/date'
import { useDateField } from '@/shared/date/useDateField'
import { computed, ref } from 'vue'
import { injectDateFieldRootContext } from './DateFieldRoot.vue'

export interface DateFieldInputProps extends PrimitiveProps {
  /** The part of the date to render */
  part: SegmentPart
}
</script>

<script setup lang="ts">
const props = defineProps<DateFieldInputProps>()

const rootContext = injectDateFieldRootContext()

const hasLeftFocus = ref(true)
const lastKeyZero = ref(false)

const {
  handleSegmentClick,
  handleSegmentKeydown,
  attributes,
} = useDateField({
  hasLeftFocus,
  lastKeyZero,
  placeholder: rootContext.placeholder,
  hourCycle: rootContext.hourCycle,
  segmentValues: rootContext.segmentValues,
  formatter: rootContext.formatter,
  part: props.part,
  disabled: rootContext.disabled,
  readonly: rootContext.readonly,
  focusNext: rootContext.focusNext,
  modelValue: rootContext.modelValue,
  programmaticContinuation: rootContext.programmaticContinuation,
})

const disabled = computed(() => rootContext.disabled.value)
const readonly = computed(() => rootContext.readonly.value)
const isInvalid = computed(() => rootContext.isInvalid.value)

function handleFocusOut(e: FocusEvent) {
  if (rootContext.programmaticContinuation.value) {
    hasLeftFocus.value = false
  }
  else {
    hasLeftFocus.value = true
  }
}

function handleFocusIn(e: FocusEvent) {
  rootContext.setFocusedElement(e.target as HTMLElement)
  const dayValue = rootContext.segmentValues.value.day
  const yearValue = rootContext.segmentValues.value.year

  if (rootContext.programmaticContinuation.value) {
    if (props.part === 'year' && yearValue) {
      // create key event for keyword with rootContext.segmentValues.value.year
      const event = new KeyboardEvent('keydown', {
        key: yearValue.toString(),
        code: `Digit${yearValue}`,
        keyCode: 48 + yearValue,
        which: 48 + yearValue,
        bubbles: true,
        cancelable: true,
      })

      console.log('triggering keydown for year', event)

      hasLeftFocus.value = false
      handleSegmentKeydown(event)
      rootContext.programmaticContinuation.value = false
    }
    else if (props.part === 'day' && dayValue) {
      // create key event for keyword with rootContext.segmentValues.value.day
      const event = new KeyboardEvent('keydown', {
        key: dayValue.toString(),
        code: `Digit${dayValue}`,
        keyCode: 48 + dayValue,
        which: 48 + dayValue,
        bubbles: true,
        cancelable: true,
      })

      console.log('triggering keydown for day', event)

      hasLeftFocus.value = false
      handleSegmentKeydown(event)
      rootContext.programmaticContinuation.value = false
    }
  }
  else {
    hasLeftFocus.value = true
  }
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="attributes"
    :contenteditable="disabled || readonly ? false : part !== 'literal'"
    :data-reka-date-field-segment="part"
    :aria-disabled="disabled ? true : undefined"
    :aria-readonly="readonly ? true : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-invalid="isInvalid ? '' : undefined"
    :aria-invalid="isInvalid ? true : undefined"
    v-on="part !== 'literal' ? {
      mousedown: handleSegmentClick,
      keydown: handleSegmentKeydown,
      focusout: handleFocusOut,
      focusin: handleFocusIn,
    } : {}"
  >
    <slot />
  </Primitive>
</template>
