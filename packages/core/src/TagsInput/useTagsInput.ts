import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TagsInputItemContext } from './TagsInputItem.vue'
import type { AcceptableInputValue, TagsInputRootContext } from './TagsInputRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface, SelectionState } from '@/shared'
import type { Direction } from '@/shared/types'
import { isEqual } from 'ohash'
import { computed, nextTick, ref, toValue } from 'vue'
import { createPartSurface, selectionState, useArrowNavigation, useComposing, useControllableState } from '@/shared'

/**
 * Why the tags changed; carried as `details.reason` on every change (#2828).
 * - `enter-key` / `tab-key` / `blur` / `delimiter` / `paste`: the input added its draft.
 * - `backspace-key` / `delete-key`: the selected tag was removed from the input.
 * - `item-delete-press`: a `TagsInputItemDelete` was pressed.
 * - `clear-press`: `TagsInputClear` was pressed.
 */
export type TagsInputChangeReason
  = | 'enter-key'
    | 'tab-key'
    | 'blur'
    | 'delimiter'
    | 'paste'
    | 'backspace-key'
    | 'delete-key'
    | 'item-delete-press'
    | 'clear-press'

export type TagsInputRootState = { invalid: boolean, disabled: boolean, focused: boolean }
export type TagsInputInputState = { invalid: boolean }
export type TagsInputItemState = { state: SelectionState, disabled: boolean }
export type TagsInputItemTextState = Record<string, never>
export type TagsInputClearState = { disabled: boolean }

/** One rendered tag, as `useCollection().getItems()` returns them. */
export interface TagsInputCollectionItem<T = AcceptableInputValue> {
  ref: HTMLElement
  value?: T
}

type Reason = TagsInputChangeReason | BaseChangeReason

export interface UseTagsInputProps<T extends AcceptableInputValue = string> {
  /**
   * Controlled tags. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<Array<T> | null | undefined>
  /** Initial tags when uncontrolled. @defaultValue `[]` */
  defaultValue?: MaybeRefOrGetter<Array<T> | undefined>
  addOnPaste?: MaybeRefOrGetter<boolean | undefined>
  addOnTab?: MaybeRefOrGetter<boolean | undefined>
  addOnBlur?: MaybeRefOrGetter<boolean | undefined>
  duplicate?: MaybeRefOrGetter<boolean | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `','` */
  delimiter?: MaybeRefOrGetter<string | RegExp | undefined>
  /** @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Maximum number of tags; `0` is unlimited. @defaultValue `0` */
  max?: MaybeRefOrGetter<number | undefined>
  /** Id given to the input. */
  id?: MaybeRefOrGetter<string | undefined>
  convertValue?: (value: string) => T
  /** @defaultValue `value.toString()` */
  displayValue?: (value: T) => string
  /** Whether focus is inside the root (the SFC hands `useFocusWithin`); drives `data-focused`. */
  focused?: MaybeRefOrGetter<boolean | undefined>
  /**
   * The rendered tags in DOM order (the SFC injects `useCollection({ isProvider: true }).getItems`)
   * — the seam a composable cannot own itself. Without it, arrow-key / Backspace tag
   * navigation from the input is inert.
   */
  getItems?: () => TagsInputCollectionItem<T>[]
  /** Component `emit`; receives `beforeUpdate:modelValue`, `update:modelValue`, `addTag`, `removeTag` and `invalid`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: Array<T>, details: ChangeEventDetails<TagsInputChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: Array<T>, details: ChangeEventDetails<TagsInputChangeReason>) => void
  onAddTag?: (value: T) => void
  onRemoveTag?: (value: T) => void
  onInvalid?: (value: T) => void
}

export interface TagsInputItemSurfaceOptions {
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** The tag's element, used to tell whether it is the selected tag. */
  element?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** Id for the tag text; defaults to a unique id per call. */
  textId?: string
}

export interface TagsInputItemSurfaces {
  item: PartSurface<TagsInputItemState>
  text: PartSurface<TagsInputItemTextState>
  delete: PartSurface<TagsInputItemState>
  context: TagsInputItemContext
}

export interface UseTagsInputReturn<T extends AcceptableInputValue = string> {
  modelValue: ComputedRef<Array<T>>
  /**
   * Add tags from input text with the `max` / `duplicate` / `convertValue` rules.
   * Several texts (a paste) commit as ONE change. Returns `true` when at least one
   * tag was added.
   */
  addTags: (texts: string[], reason?: Reason, event?: Event) => boolean
  /** Remove the tag at `index`; returns `false` when out of range, unchanged or cancelled. */
  removeTag: (index: number, reason?: Reason, event?: Event) => boolean
  /** Remove every tag; returns `false` when already empty or cancelled. */
  clear: (reason?: Reason, event?: Event) => boolean
  /** Write the whole list (no rules); returns `false` when unchanged or cancelled. */
  setModelValue: (value: Array<T>, reason?: Reason, event?: Event) => boolean
  selectedElement: Ref<HTMLElement | undefined>
  isInvalidInput: Ref<boolean>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<TagsInputChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<TagsInputRootState>
  input: PartSurface<TagsInputInputState>
  clearButton: PartSurface<TagsInputClearState>
  /** Item / item text / item delete surfaces for one tag. Call once per tag. */
  getItemSurfaces: (value: MaybeRefOrGetter<T>, options?: TagsInputItemSurfaceOptions) => TagsInputItemSurfaces
  context: TagsInputRootContext<T>
}

let count = 0

/**
 * Headless TagsInput logic. The `.vue` shells compose this; a standalone consumer
 * gets the tag model, the input's add/delimiter/paste/blur handling and the
 * per-part `aria` / `data-*`, but must hand in `getItems` (the rendered tags) for
 * arrow-key and Backspace navigation — the `Collection` family is a component
 * wrapper a composable cannot absorb.
 *
 * SSR-safe and callable outside `setup()` (computed-only, no lifecycle hooks).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useTagsInput<T extends AcceptableInputValue = string>(props: UseTagsInputProps<T> = {}): UseTagsInputReturn<T> {
  const defaultValue = () => toValue(props.defaultValue) ?? []
  const { state: rawModelValue, setState, lastChangeDetails, isControlled } = useControllableState<Array<T>, TagsInputChangeReason>({
    prop: props.modelValue as MaybeRefOrGetter<Array<T> | undefined>,
    defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
    isEqual: (a, b) => isEqual(a, b),
  })
  const modelValue = computed(() => Array.isArray(rawModelValue.value) ? rawModelValue.value : [] as Array<T>)

  const disabled = computed(() => toValue(props.disabled) ?? false)
  const delimiter = computed(() => toValue(props.delimiter) ?? ',')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const max = computed(() => toValue(props.max) ?? 0)
  const addOnPaste = computed(() => toValue(props.addOnPaste) ?? false)
  const addOnTab = computed(() => toValue(props.addOnTab) ?? false)
  const addOnBlur = computed(() => toValue(props.addOnBlur) ?? false)
  const id = computed(() => toValue(props.id))
  const displayValue = (value: T) => props.displayValue ? props.displayValue(value) : value.toString()
  const getItems = props.getItems ?? (() => [])

  const selectedElement = ref<HTMLElement>()
  const isInvalidInput = ref(false)

  function emitEvent(name: 'addTag' | 'removeTag' | 'invalid', value: T) {
    const callback = name === 'addTag' ? props.onAddTag : name === 'removeTag' ? props.onRemoveTag : props.onInvalid
    callback?.(value)
    props.emit?.(name, value)
  }

  function setModelValue(value: Array<T>, reason: Reason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  function addTags(texts: string[], reason: Reason = 'imperative-action', event?: Event): boolean {
    const array = [...modelValue.value]
    const added: T[] = []
    for (const text of texts) {
      const modelValueIsObject = array.length > 0 && typeof array[0] === 'object'
      const defaultValueIsObject = array.length > 0 && typeof defaultValue()[0] === 'object'

      // `TagsInputInput` is optional, so this is checked at runtime rather than at the type level.
      if ((modelValueIsObject || defaultValueIsObject) && typeof props.convertValue !== 'function')
        throw new Error('You must provide a `convertValue` function when using objects as values.')
      const payload = props.convertValue ? props.convertValue(text) : text as T

      if ((array.length >= max.value) && !!max.value) {
        emitEvent('invalid', payload)
        continue
      }

      if (toValue(props.duplicate) || !array.includes(payload)) {
        array.push(payload)
        added.push(payload)
        continue
      }
      isInvalidInput.value = true
      emitEvent('invalid', payload)
    }

    if (!added.length || !setState(array, reason, event))
      return false
    added.forEach(value => emitEvent('addTag', value))
    return true
  }

  function removeTag(index: number, reason: Reason = 'imperative-action', event?: Event): boolean {
    if (index < 0 || index >= modelValue.value.length)
      return false
    const removedValue = modelValue.value[index]
    if (!setState(modelValue.value.filter((_, i) => i !== index), reason, event))
      return false
    emitEvent('removeTag', removedValue)
    return true
  }

  function clear(reason: Reason = 'imperative-action', event?: Event) {
    return setState([], reason, event)
  }

  function onInputKeydown(event: KeyboardEvent) {
    // Don't navigate/select tags mid-composition, keys are used for IME candidate navigation
    if (event.isComposing)
      return
    const target = event.target as HTMLInputElement
    const collection = getItems().map(i => i.ref).filter(i => i.dataset.disabled !== '')
    if (!collection.length)
      return
    const lastTag = collection.at(-1)
    switch (event.key) {
      case 'Delete':
      case 'Backspace': {
        if (target.selectionStart !== 0 || target.selectionEnd !== 0)
          break

        if (selectedElement.value) {
          const index = collection.findIndex(i => i === selectedElement.value)
          const selectedItem = getItems().find(i => i.ref === selectedElement.value)
          const modelIndex = selectedItem ? modelValue.value.findIndex(v => isEqual(v, selectedItem.value)) : -1
          // A cancelled (or no-op) removal keeps the current tag selected.
          if (removeTag(modelIndex, event.key === 'Delete' ? 'delete-key' : 'backspace-key', event))
            selectedElement.value = selectedElement.value === lastTag ? collection.at(index - 1) : collection.at(index + 1)
          event.preventDefault()
        }
        else if (event.key === 'Backspace') {
          selectedElement.value = lastTag
          event.preventDefault()
        }
        break
      }
      case 'Home':
      case 'End':
      case 'ArrowRight':
      case 'ArrowLeft': {
        const isArrowRight = (event.key === 'ArrowRight' && dir.value === 'ltr') || (event.key === 'ArrowLeft' && dir.value === 'rtl')
        const isArrowLeft = !isArrowRight
        // only focus on tags when cursor is at the first position
        if (target.selectionStart !== 0 || target.selectionEnd !== 0)
          break

        // if you press ArrowLeft, then we last tag
        if (isArrowLeft && !selectedElement.value) {
          selectedElement.value = lastTag
          event.preventDefault()
        }
        // if you press ArrowRight on last tag, you deselect
        else if (isArrowRight && lastTag && selectedElement.value === lastTag) {
          selectedElement.value = undefined
          event.preventDefault()
        }
        else if (selectedElement.value) {
          const el = useArrowNavigation(event, selectedElement.value, undefined, {
            itemsArray: collection,
            loop: false,
            dir: dir.value,
          })
          if (el)
            selectedElement.value = el
          event.preventDefault()
        }
        break
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        if (selectedElement.value)
          event.preventDefault()
        break
      }
      default: {
        selectedElement.value = undefined
      }
    }
  }

  const context: TagsInputRootContext<T> = {
    modelValue,
    onAddValue: (payload, reason, event) => addTags([payload], reason, event),
    onAddValues: (payloads, reason, event) => addTags(payloads, reason, event),
    onRemoveValue: removeTag,
    onClear: clear,
    onInputKeydown,
    selectedElement,
    isInvalidInput,
    addOnPaste,
    addOnBlur,
    addOnTab,
    dir,
    disabled,
    delimiter,
    max,
    id,
    displayValue,
  }

  const root = createPartSurface<TagsInputRootState>(
    () => ({ dir: dir.value }),
    () => ({ invalid: isInvalidInput.value, disabled: disabled.value, focused: toValue(props.focused) ?? false }),
  )

  return {
    modelValue,
    addTags,
    removeTag,
    clear,
    setModelValue,
    selectedElement,
    isInvalidInput,
    lastChangeDetails,
    isControlled,
    root,
    input: createTagsInputInputSurface(context),
    clearButton: getTagsInputClearSurface(context),
    getItemSurfaces: (value, options = {}) => {
      const element = options.element
      const isSelected = computed(() => {
        const el = toValue(element)
        return !!el && selectedElement.value === el
      })
      const itemDisabled = computed(() => !!(toValue(options.disabled) || disabled.value))
      const itemContext = createTagsInputItemContext(context, {
        value: computed(() => toValue(value)),
        isSelected,
        disabled: itemDisabled,
        textId: options.textId ?? `reka-tags-input-item-text-${++count}`,
      })
      return {
        item: getTagsInputItemSurface(itemContext),
        text: getTagsInputItemTextSurface(itemContext),
        delete: getTagsInputItemDeleteSurface(context, itemContext),
        context: itemContext,
      }
    },
    context,
  }
}

/**
 * Builds a tag's item context. `textId` is backed by a ref, so the text part
 * allocating its id after the item rendered still updates `aria-labelledby`.
 * @internal
 */
export function createTagsInputItemContext<T extends AcceptableInputValue>(
  rootContext: Pick<TagsInputRootContext<T>, 'displayValue'>,
  options: { value: Ref<T>, isSelected: Ref<boolean>, disabled: Ref<boolean>, textId?: string },
): TagsInputItemContext {
  const textId = ref(options.textId ?? '')
  return {
    value: options.value as Ref<AcceptableInputValue>,
    isSelected: options.isSelected,
    disabled: options.disabled,
    get textId() {
      return textId.value
    },
    set textId(value: string) {
      textId.value = value
    },
    displayValue: computed(() => rootContext.displayValue(options.value.value)),
  }
}

function itemStateOf(itemContext: TagsInputItemContext): TagsInputItemState {
  return { state: selectionState(itemContext.isSelected.value), disabled: itemContext.disabled?.value ?? false }
}

/** @internal */
export function getTagsInputItemSurface(itemContext: TagsInputItemContext): PartSurface<TagsInputItemState> {
  return createPartSurface<TagsInputItemState>(
    () => ({
      'aria-labelledby': itemContext.textId,
      'aria-current': itemContext.isSelected.value,
    }),
    () => itemStateOf(itemContext),
  )
}

/** @internal */
export function getTagsInputItemTextSurface(itemContext: TagsInputItemContext): PartSurface<TagsInputItemTextState> {
  return createPartSurface<TagsInputItemTextState>(() => ({ id: itemContext.textId }), () => ({}))
}

/** @internal */
export function getTagsInputItemDeleteSurface(
  rootContext: Pick<TagsInputRootContext<any>, 'modelValue' | 'disabled' | 'onRemoveValue'>,
  itemContext: TagsInputItemContext,
): PartSurface<TagsInputItemState> {
  const disabled = computed(() => !!(itemContext.disabled?.value || rootContext.disabled.value))
  return createPartSurface<TagsInputItemState>(
    () => ({
      'tabindex': -1,
      'aria-labelledby': itemContext.textId,
      'aria-current': itemContext.isSelected.value,
      'onClick': (event: MouseEvent) => {
        if (disabled.value)
          return
        const index = rootContext.modelValue.value.findIndex(i => isEqual(i, itemContext.value.value))
        rootContext.onRemoveValue(index, 'item-delete-press', event)
      },
    }),
    () => ({ state: selectionState(itemContext.isSelected.value), disabled: disabled.value }),
  )
}

/** @internal */
export function getTagsInputClearSurface(rootContext: Pick<TagsInputRootContext<any>, 'disabled' | 'onClear'>): PartSurface<TagsInputClearState> {
  return createPartSurface<TagsInputClearState>(
    () => ({
      onClick: (event: MouseEvent) => {
        if (rootContext.disabled.value)
          return
        rootContext.onClear('clear-press', event)
      },
    }),
    () => ({ disabled: rootContext.disabled.value }),
  )
}

export interface TagsInputInputSurfaceOptions {
  placeholder?: MaybeRefOrGetter<string | undefined>
  maxLength?: MaybeRefOrGetter<number | undefined>
}

/**
 * The input's surface. Creates per-instance IME composition state, so call it
 * exactly once per input.
 * @internal
 */
export function createTagsInputInputSurface(
  context: TagsInputRootContext<any>,
  options: TagsInputInputSurfaceOptions = {},
): PartSurface<TagsInputInputState> {
  const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing()

  /**
   * Adds the typed text as a tag and clears the input once the model actually
   * changed. A controlled parent that ignores `update:modelValue` leaves the
   * model as it was, so the typed text stays. A controlled prop arrives on the
   * next tick, hence the deferred check; the text is only cleared if the user
   * has not typed since.
   */
  function addTypedText(target: HTMLInputElement, reason: TagsInputChangeReason, event: Event) {
    const text = target.value
    const before = context.modelValue.value
    if (!context.onAddValue(text, reason, event))
      return
    if (context.modelValue.value !== before) {
      target.value = ''
      return
    }
    nextTick(() => {
      if (context.modelValue.value !== before && target.value === text)
        target.value = ''
    })
  }

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

    addTypedText(target, 'blur', event)
  }

  async function handleCustomKeydown(event: KeyboardEvent, reason: TagsInputChangeReason, { preventImplicitSubmit = false } = {}) {
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

    addTypedText(target, reason, event)

    // Keep focus in the input after `Tab` adds a tag. A browser still honours this
    // from a microtask of the keydown dispatch; `Enter` was already cancelled above.
    nativePreventDefault()
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

      addTypedText(target, 'delimiter', event)
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Same order as the v2 template: `@keydown.enter`, `@keydown.tab`, then `@keydown`.
    // Matched case-insensitively like Vue's key modifiers.
    const key = event.key?.toLowerCase()
    let pending: Promise<void> | undefined
    if (key === 'enter')
      pending = handleCustomKeydown(event, 'enter-key', { preventImplicitSubmit: true })
    if (key === 'tab' && context.addOnTab.value)
      pending = handleCustomKeydown(event, 'tab-key')
    // `isComposing` stays true until the tick after `compositionend`, so arrow/backspace
    // tag navigation is skipped even when the commit keydown reports `event.isComposing === false`.
    if (!isComposing.value)
      context.onInputKeydown(event)
    // Returned so Vue's listener error handling sees a rejection (e.g. a missing `convertValue`).
    return pending
  }

  function handlePaste(event: ClipboardEvent) {
    if (!context.addOnPaste.value)
      return
    event.preventDefault()
    const clipboardData = event.clipboardData
    if (!clipboardData)
      return

    const value = clipboardData.getData('text')
    // A paste commits every tag it adds as one change.
    context.onAddValues(context.delimiter.value ? value.split(context.delimiter.value) : [value], 'paste', event)
  }

  return createPartSurface<TagsInputInputState>(
    () => ({
      id: context.id?.value,
      type: 'text',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      maxlength: toValue(options.maxLength),
      placeholder: toValue(options.placeholder),
      disabled: context.disabled.value,
      onInput: handleInput,
      onKeydown: handleKeydown,
      onBlur: handleBlur,
      onCompositionstart: handleCompositionStart,
      onCompositionend: handleCompositionEnd,
      onPaste: handlePaste,
    }),
    () => ({ invalid: context.isInvalidInput.value }),
  )
}
