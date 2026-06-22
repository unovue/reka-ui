<script lang="ts">
import type { Ref, VNode } from 'vue'
import type { Direction } from '../shared/types'
import { createContext, useDirection, useFormControl } from '@/shared'

export interface SelectRootProps {
  /** The controlled open state of the Select. Can be bind as `v-model:open`. */
  open?: boolean
  /** The open state of the select when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** The value of the select when initially rendered. Use when you do not need to control the state of the Select */
  defaultValue?: string
  /** The controlled value of the Select. Can be bind as `v-model`. */
  modelValue?: string
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** The name of the Select. Submitted with its owning form as part of a name/value pair. */
  name?: string
  /** Native html input `autocomplete` attribute. */
  autocomplete?: string
  /** When `true`, prevents the user from interacting with Select */
  disabled?: boolean
  /** When `true`, indicates that the user must select a value before the owning form can be submitted. */
  required?: boolean
}
export type SelectRootEmits = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: string]
  /** Event handler called when the open state of the context menu changes. */
  'update:open': [value: boolean]
}

export interface SelectRootContext {
  triggerElement: Ref<HTMLElement | undefined>
  onTriggerChange: (node: HTMLElement | undefined) => void
  valueElement: Ref<HTMLElement | undefined>
  onValueElementChange: (node: HTMLElement) => void
  valueElementHasChildren: Ref<boolean>
  onValueElementHasChildrenChange: (hasChildren: boolean) => void
  contentId: string
  modelValue?: Ref<string>
  onValueChange: (value: string) => void
  open: Ref<boolean>
  required?: Ref<boolean>
  onOpenChange: (open: boolean) => void
  dir: Ref<Direction>
  triggerPointerDownPosRef: Ref<{ x: number, y: number } | null>
  disabled?: Ref<boolean>
}

export const [injectSelectRootContext, provideSelectRootContext]
  = createContext<SelectRootContext>('SelectRoot')

const openSelects = new Set<(open: boolean) => void>()

export interface SelectNativeOptionsContext {
  onNativeOptionAdd: (option: VNode) => void
  onNativeOptionRemove: (option: VNode) => void
}

export const [injectSelectNativeOptionsContext, provideSelectNativeOptionsContext]
  = createContext<SelectNativeOptionsContext>('SelectRoot')
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRefs } from 'vue'
import BubbleSelect from './BubbleSelect.vue'
import { PopperRoot } from '@/Popper'
import { useVModel } from '@vueuse/core'

const props = withDefaults(defineProps<SelectRootProps>(), {
  defaultValue: '',
  modelValue: undefined,
  open: undefined,
})

const emits = defineEmits<SelectRootEmits>()

defineSlots<{
  default: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<string>

const open = useVModel(props, 'open', emits, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const triggerElement = ref<HTMLElement>()
const valueElement = ref<HTMLElement>()
const triggerPointerDownPosRef = ref({
  x: 0,
  y: 0,
})
const valueElementHasChildren = ref(false)

function handleOpenChange(value: boolean) {
  open.value = value

  if (value) {
    openSelects.forEach((onOpenChange) => {
      if (onOpenChange !== handleOpenChange)
        onOpenChange(false)
    })
  }
}

onMounted(() => {
  openSelects.add(handleOpenChange)
})

onUnmounted(() => {
  openSelects.delete(handleOpenChange)
})

const { required, disabled, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
provideSelectRootContext({
  triggerElement,
  onTriggerChange: (node) => {
    triggerElement.value = node
  },
  valueElement,
  onValueElementChange: (node) => {
    valueElement.value = node
  },
  valueElementHasChildren,
  onValueElementHasChildrenChange: (hasChildren) => {
    valueElementHasChildren.value = hasChildren
  },
  contentId: '',
  modelValue,
  onValueChange: (value) => {
    modelValue.value = value
  },
  open,
  required,
  onOpenChange: handleOpenChange,
  dir,
  triggerPointerDownPosRef,
  disabled,
})

const isFormControl = useFormControl(triggerElement)
const nativeOptionsSet = ref<Set<VNode>>(new Set())

// The native `select` only associates the correct default value if the corresponding
// `option` is rendered as a child **at the same time** as itself.
// Because it might take a few renders for our items to gather the information to build
// the native `option`(s), we generate a key on the `select` to make sure Vue re-builds it
// each time the options change.
const nativeSelectKey = computed(() => {
  return Array.from(nativeOptionsSet.value)
    .map(option => option.props?.value)
    .join(';')
})

provideSelectNativeOptionsContext({
  onNativeOptionAdd: (option) => {
    nativeOptionsSet.value.add(option)
  },
  onNativeOptionRemove: (option) => {
    nativeOptionsSet.value.delete(option)
  },
})
</script>

<template>
  <PopperRoot>
    <slot
      :model-value="modelValue"
      :open="open"
    />

    <BubbleSelect
      v-if="isFormControl"
      :key="nativeSelectKey"
      v-bind="$attrs"
      aria-hidden="true"
      tabindex="-1"
      :required="required"
      :name="name"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :value="modelValue"
      @change="modelValue = $event.target.value"
    >
      <option
        v-if="modelValue === undefined"
        value=""
      />
      <component
        v-bind="option.props"
        :is="option"
        v-for="option in Array.from(nativeOptionsSet)"
        :key="option.key ?? ''"
      />
    </BubbleSelect>
  </PopperRoot>
</template>
