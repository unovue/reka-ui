<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { Primitive, usePrimitiveElement } from '@/Primitive'

export interface EditableInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, watch } from 'vue'
import { disabledAttr, useKbd, useTranslations } from '@/shared'
import { injectEditableRootContext } from './EditableRoot.vue'

const props = withDefaults(defineProps<EditableInputProps>(), {
  as: 'input',
})

const t = useTranslations()

const kbd = useKbd()

const context = injectEditableRootContext()

const disabled = computed(() => context.disabled.value)

const placeholder = computed(() => context.placeholder.value?.edit)

const { primitiveElement, currentElement: inputRef } = usePrimitiveElement()

// The default name only fills in when the consumer gives none: an `aria-label` or `aria-labelledby`
// attribute, or a `<label>` for the input (wrapping it, or pointing at the root's `id`).
const attrs = useAttrs()
const hasLabelElement = ref(false)
const ariaLabel = computed(() => (attrs['aria-labelledby'] || hasLabelElement.value) ? undefined : t('editableInput'))

// Checked on mount and each time editing starts, which is when the input is shown, so a label added later counts.
function updateHasLabelElement() {
  hasLabelElement.value = !!(inputRef.value as HTMLInputElement | undefined)?.labels?.length
}

onMounted(() => {
  context.inputRef.value = inputRef.value as HTMLInputElement
  updateHasLabelElement()
  if (context.startWithEditMode.value) {
    context.inputRef.value?.focus({ preventScroll: true })
    if (context.selectOnFocus.value)
      context.inputRef.value?.select()
  }
})

watch(context.isEditing, (value) => {
  if (value) {
    updateHasLabelElement()
    nextTick(() => {
      context.inputRef.value?.focus({ preventScroll: true })
      if (context.selectOnFocus.value)
        context.inputRef.value?.select()
    })
  }
})

function handleSubmitKeyDown(event: KeyboardEvent) {
  if ((context.submitMode.value === 'enter' || context.submitMode.value === 'both') && event.key === kbd.ENTER && !event.shiftKey && !event.metaKey && !event.isComposing)
    context.submit()
}
</script>

<template>
  <Primitive
    v-bind="props"
    :id="context.id.value"
    ref="primitiveElement"
    :value="context.inputValue.value"
    :placeholder="placeholder"
    :disabled="disabledAttr(disabled, props.as, props.asChild)"
    :maxlength="context.maxLength.value"
    :data-disabled="disabled ? '' : undefined"
    :data-readonly="context.readonly.value ? '' : undefined"
    :readonly="context.readonly.value"
    :aria-label="ariaLabel"
    :hidden="context.autoResize.value ? undefined : !context.isEditing.value"
    :style="context.autoResize.value ? { all: 'unset', gridArea: '1 / 1 / auto / auto', visibility: !context.isEditing.value ? 'hidden' : undefined } : undefined"
    @input="context.inputValue.value = $event.target.value"
    @keydown.enter.space="handleSubmitKeyDown"
    @keydown.esc="context.cancel"
  >
    <slot />
  </Primitive>
</template>
