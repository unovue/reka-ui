<script setup lang="ts">
import type { ReferenceElement } from 'reka-ui'
import { computedWithControl } from '@vueuse/core'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, Label, useFilter } from 'reka-ui'
import { computed, ref, watch, watchEffect } from 'vue'
import { getList, getValue } from './list'
import { getAnchorRect, getSearchValue, getTrigger, getTriggerOffset, replaceValue } from './utils'

const { contains } = useFilter({ sensitivity: 'base' })

const value = ref('')
const trigger = ref<string | null>(null)
const caretOffset = ref<number | null>(null)
const open = ref(false)
const searchValue = ref('')

const textareaRef = ref<InstanceType<typeof ComboboxInput>>()

const reference = computedWithControl(() => [searchValue.value, open.value], () => ({
  getBoundingClientRect: () => {
    if (textareaRef.value?.$el) {
      const { x, y, height } = getAnchorRect(textareaRef.value?.$el)
      return { x, y, height, top: y, left: x, width: 0 }
    }
    else {
      return null
    }
  },
}) as ReferenceElement)

const list = computed(() => {
  const _list = getList(trigger.value)
  return _list.filter(item => contains(item, searchValue.value))
})

watch(() => list.value.length, () => {
  open.value = !!list.value.length
})

watchEffect(() => {
  const textarea = textareaRef.value?.$el as HTMLTextAreaElement | undefined
  if (caretOffset.value !== null && textarea) {
    textarea.setSelectionRange(caretOffset.value, caretOffset.value)
  }
})

function handleChange(ev: InputEvent) {
  const target = ev.target as HTMLTextAreaElement
  const _trigger = getTrigger(target)
  const _searchValue = getSearchValue(target)

  if (_trigger) {
    trigger.value = _trigger
    open.value = true
  }
  else if (!_searchValue) {
    trigger.value = null
    open.value = false
  }

  value.value = target.value
  searchValue.value = _searchValue

  if (!_trigger)
    open.value = false
}

function handleSelect(ev: CustomEvent) {
  const textarea = textareaRef.value?.$el
  if (!textarea)
    return

  const offset = getTriggerOffset(textarea)
  const displayValue = getValue(ev.detail.value, trigger.value)
  if (!displayValue)
    return

  // prevent setting `ComboobxInput`
  ev.preventDefault()

  trigger.value = null
  value.value = replaceValue(value.value, offset, searchValue.value, displayValue)
  const nextCaretOffset = offset + displayValue.length + 1
  caretOffset.value = nextCaretOffset
}
</script>

<template>
  <ComboboxRoot
    v-model:open="open"
    ignore-filter
    :reset-search-term-on-blur="false"
    class="text-foreground flex flex-col"
  >
    <Label
      for="comment"
      class="text-sm font-semibold"
    >
      Comment
    </Label>

    <ComboboxInput
      id="comment"
      ref="textareaRef"
      v-model="value"
      as="textarea"
      class="mt-2 border rounded-md border-muted w-80 p-2"
      rows="5"
      placeholder="Type @, # or :"
      @input="handleChange"
      @pointerdown="open = false"
      @keydown.enter="(ev: KeyboardEvent) => {
        if (open)
          ev.preventDefault()
      }"
      @keydown.left.right="open = false"
    />
    <ComboboxAnchor :reference="reference" />

    <ComboboxPortal>
      <ComboboxContent
        v-if="list.length"
        position="popper"
        side="bottom"
        align="start"
        class="overflow-y-auto overflow-x-hidden max-h-48 max-w-80 bg-card border border-muted-foreground/30 p-1.5 rounded-md"
      >
        <ComboboxItem
          v-for="item in list"
          :key="item"
          :value="item"
          class="px-2 py-1 data-[highlighted]:bg-muted rounded flex cursor-default"
          @select="handleSelect"
        >
          <span class="truncate">{{ item }}</span>
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
