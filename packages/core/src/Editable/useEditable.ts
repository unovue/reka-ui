import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ActivationMode, EditableRootContext, EditableState, SubmitMode } from './EditableRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Direction } from '@/shared/types'
import { computed, ref, toRaw, toValue, watch } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'

/**
 * Why the value changed; carried as `details.reason` on every change (#2828).
 * Editable writes its model only when the draft is submitted:
 * - `'submit-press'`: `EditableSubmitTrigger` was clicked;
 * - `'enter-key'`: Enter in `EditableInput` (`submitMode` `'enter'` / `'both'`);
 * - `'outside-press'`: a pointer down outside the root (`submitMode` `'blur'` / `'both'`);
 * - `'focus-outside'`: focus moved outside the root (`submitMode` `'blur'` / `'both'`).
 *
 * `submit()` called from a slot, a template ref or the composable reports `'imperative-action'`.
 */
export type EditableChangeReason = 'submit-press' | 'enter-key' | 'outside-press' | 'focus-outside'

export type EditableAreaState = {
  placeholderShown: boolean
  focus: boolean
  focused: boolean
  empty: boolean
  readonly: boolean
  disabled: boolean
}
export type EditablePreviewState = { placeholderShown: boolean }
export type EditableInputState = { disabled: boolean, readonly: boolean }
export type EditableTriggerState = { disabled: boolean }

type SubmitReason = EditableChangeReason | BaseChangeReason

export interface UseEditableProps {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<string | null | undefined>
  /** Initial value when uncontrolled. @defaultValue `''` */
  defaultValue?: MaybeRefOrGetter<string | undefined>
  /** A string, or separate placeholders for edit and preview. @defaultValue `'Enter text...'` */
  placeholder?: MaybeRefOrGetter<string | { edit: string, preview: string } | undefined>
  dir?: MaybeRefOrGetter<Direction | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  readonly?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'focus'` */
  activationMode?: MaybeRefOrGetter<ActivationMode | undefined>
  selectOnFocus?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'blur'` */
  submitMode?: MaybeRefOrGetter<SubmitMode | undefined>
  /** Read once, for the initial edit mode. */
  startWithEditMode?: MaybeRefOrGetter<boolean | undefined>
  maxLength?: MaybeRefOrGetter<number | undefined>
  autoResize?: MaybeRefOrGetter<boolean | undefined>
  id?: MaybeRefOrGetter<string | undefined>
  name?: MaybeRefOrGetter<string | undefined>
  /**
   * Component `emit`; receives `beforeUpdate:modelValue`, `update:modelValue`,
   * `update:state` and `submit`.
   */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a submitted value commits; `details.cancel()` vetoes it and keeps edit mode. */
  onBeforeUpdate?: (value: string, details: ChangeEventDetails<EditableChangeReason>) => void
  /** Called after a submitted value commits. */
  onUpdate?: (value: string, details: ChangeEventDetails<EditableChangeReason>) => void
  /** Called after every submit, with the submitted draft (also when it equals the current value). */
  onSubmit?: (value: string | null | undefined) => void
  /** Called whenever edit mode is entered, cancelled or submitted. */
  onStateChange?: (state: EditableState) => void
}

export interface UseEditableReturn {
  modelValue: ComputedRef<string | null | undefined>
  /** The draft shown in the input while editing. */
  inputValue: Ref<string | null | undefined>
  isEditing: Ref<boolean>
  isEmpty: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  /** Enter edit mode, resetting the draft to the current value. */
  edit: () => void
  /** Leave edit mode without committing the draft. */
  cancel: () => void
  /**
   * Commit the draft and leave edit mode. Returns `false` when
   * `beforeUpdate:modelValue` cancelled the change; edit mode then stays on.
   */
  submit: (reason?: SubmitReason, event?: Event) => boolean
  /**
   * What an outside pointer down or focus does: submits (`submitMode` `'blur'` /
   * `'both'`) or cancels. Wire it to your own outside detection when standalone.
   */
  dismiss: (reason: 'outside-press' | 'focus-outside', event?: Event) => void
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<EditableChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<Record<string, never>>
  area: PartSurface<EditableAreaState>
  preview: PartSurface<EditablePreviewState>
  input: PartSurface<EditableInputState>
  editTrigger: PartSurface<EditableTriggerState>
  submitTrigger: PartSurface<EditableTriggerState>
  cancelTrigger: PartSurface<EditableTriggerState>
  context: EditableRootContext
}

/** @internal */
export function getEditableAreaSurface(context: EditableRootContext): PartSurface<EditableAreaState> {
  return createPartSurface<EditableAreaState>(
    () => ({ style: context.autoResize.value ? { display: 'inline-grid' } : undefined }),
    () => ({
      placeholderShown: !context.isEditing.value,
      focus: context.isEditing.value,
      focused: context.isEditing.value,
      empty: context.isEmpty.value,
      readonly: context.readonly.value,
      disabled: context.disabled.value,
    }),
  )
}

/** @internal */
export function getEditablePreviewSurface(context: EditableRootContext): PartSurface<EditablePreviewState> {
  return createPartSurface<EditablePreviewState>(
    () => ({
      tabindex: 0,
      hidden: context.autoResize.value ? undefined : context.isEditing.value,
      style: context.autoResize.value
        ? {
            whiteSpace: 'pre',
            userSelect: 'none',
            gridArea: '1 / 1 / auto / auto',
            visibility: context.isEditing.value ? 'hidden' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }
        : undefined,
      onFocusin: () => {
        if (context.activationMode.value === 'focus')
          context.edit()
      },
      onDblclick: () => {
        if (context.activationMode.value === 'dblclick')
          context.edit()
      },
    }),
    () => ({ placeholderShown: !context.isEditing.value }),
  )
}

/** @internal */
export function getEditableInputSurface(context: EditableRootContext): PartSurface<EditableInputState> {
  return createPartSurface<EditableInputState>(
    () => ({
      'value': context.inputValue.value,
      'placeholder': context.placeholder.value?.edit,
      'disabled': context.disabled.value,
      'maxlength': context.maxLength.value,
      'readonly': context.readonly.value,
      'aria-label': 'editable input',
      'hidden': context.autoResize.value ? undefined : !context.isEditing.value,
      'style': context.autoResize.value
        ? { all: 'unset', gridArea: '1 / 1 / auto / auto', visibility: !context.isEditing.value ? 'hidden' : undefined }
        : undefined,
      'onInput': (event: Event) => {
        context.inputValue.value = (event.target as HTMLInputElement).value
      },
      // Ported from `@keydown.enter.space="handleSubmitKeyDown"` + `@keydown.esc="cancel"`.
      'onKeydown': (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          const submitMode = context.submitMode.value
          if ((submitMode === 'enter' || submitMode === 'both') && !event.shiftKey && !event.metaKey && !event.isComposing)
            context.submit('enter-key', event)
        }
        else if (event.key === 'Escape') {
          context.cancel()
        }
      },
    }),
    () => ({ disabled: context.disabled.value, readonly: context.readonly.value }),
  )
}

type TriggerKind = 'edit' | 'submit' | 'cancel'

/** @internal */
export function getEditableTriggerSurface(context: EditableRootContext, kind: TriggerKind): PartSurface<EditableTriggerState> {
  return createPartSurface<EditableTriggerState>(
    () => ({
      'aria-label': kind,
      'aria-disabled': context.disabled.value ? '' : undefined,
      'disabled': context.disabled.value,
      // Edit is visible while previewing; submit/cancel while editing.
      'hidden': (kind === 'edit' ? context.isEditing.value : !context.isEditing.value) ? '' : undefined,
      'onClick': (event: MouseEvent) => {
        if (kind === 'edit')
          context.edit()
        else if (kind === 'cancel')
          context.cancel()
        else
          context.submit('submit-press', event)
      },
    }),
    () => ({ disabled: context.disabled.value }),
  )
}

/**
 * Headless Editable logic: the submitted model, the draft, edit mode and every
 * part's attributes. `EditableRoot` keeps the outside-press / focus-outside
 * detection (`DismissableLayer` utilities, DOM-bound) and calls `dismiss`; a
 * standalone consumer wires its own outside detection to `dismiss`. Focusing
 * the input on entering edit mode also stays in `EditableInput`.
 *
 * SSR-safe (no `document` at call scope). Holds a watcher that resets the draft
 * when the model changes, so call it inside `setup()` or an `effectScope`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useEditable(props: UseEditableProps = {}): UseEditableReturn {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | null | undefined, EditableChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? '',
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ((value: string | null | undefined, details: ChangeEventDetails<EditableChangeReason>) => void) | undefined,
    onUpdate: props.onUpdate as ((value: string | null | undefined, details: ChangeEventDetails<EditableChangeReason>) => void) | undefined,
  })

  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const autoResize = computed(() => toValue(props.autoResize) ?? false)
  const selectOnFocus = computed(() => toValue(props.selectOnFocus) ?? false)
  const submitMode = computed<SubmitMode>(() => toValue(props.submitMode) ?? 'blur')
  const activationMode = computed<ActivationMode>(() => toValue(props.activationMode) ?? 'focus')
  const startWithEditMode = computed(() => toValue(props.startWithEditMode) ?? false)
  const maxLength = computed(() => toValue(props.maxLength))
  const id = computed(() => toValue(props.id))
  const name = computed(() => toValue(props.name))
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const placeholder = computed(() => {
    const value = toValue(props.placeholder) ?? 'Enter text...'
    return typeof value === 'string' ? { edit: value, preview: value } : value
  })

  const isEditing = ref(startWithEditMode.value)
  const inputValue = ref(modelValue.value) as Ref<string | null | undefined>
  const inputRef = ref<HTMLInputElement | undefined>()
  const isEmpty = computed(() => modelValue.value === '')

  watch(() => modelValue.value, () => {
    inputValue.value = modelValue.value
  }, { immediate: true })

  function emitState(state: EditableState) {
    props.onStateChange?.(state)
    props.emit?.('update:state', state)
  }

  function cancel() {
    isEditing.value = false
    emitState('cancel')
  }

  function edit() {
    isEditing.value = true
    inputValue.value = modelValue.value
    emitState('edit')
  }

  function submit(reason: SubmitReason | Event = 'imperative-action', event?: Event): boolean {
    // Tolerate `@click="submit"` from a slot or a custom part: Vue passes the
    // native event as the first argument.
    if (typeof reason !== 'string') {
      event = reason
      reason = 'imperative-action'
    }
    const draft = inputValue.value
    // An unchanged draft still leaves edit mode and fires `submit` (v2 parity);
    // only a cancelled change keeps the editor open.
    if (!Object.is(draft, toRaw(modelValue.value)) && !setState(draft, reason, event))
      return false
    isEditing.value = false
    emitState('submit')
    props.onSubmit?.(inputValue.value)
    props.emit?.('submit', inputValue.value)
    return true
  }

  // One outside interaction reports twice: a pointer press outside also moves focus
  // outside. With a mouse, `outside-press` comes first and the focus move follows in the
  // same task, so after a cancelled attempt the rest of that task is ignored. On touch the
  // press is deferred to the click, which can arrive in a later task after `focus-outside`;
  // that press is recognised by its originating `pointerdown`, which happened before the
  // cancelled attempt. One interaction, one `beforeUpdate:modelValue`.
  let dismissCancelledInTask = false
  let lastCancelledDismissAt = Number.NEGATIVE_INFINITY

  /** When the interaction behind a dismiss started: the press's `pointerdown`, else the event itself. */
  function interactionStart(event?: Event): number | undefined {
    const original = (event as CustomEvent<{ originalEvent?: Event }> | undefined)?.detail?.originalEvent
    return (original ?? event)?.timeStamp
  }

  function dismiss(reason: 'outside-press' | 'focus-outside', event?: Event) {
    if (!isEditing.value || dismissCancelledInTask)
      return
    const startedAt = interactionStart(event)
    // A deferred touch press whose pointerdown predates the cancelled attempt is that same interaction.
    if (reason === 'outside-press' && startedAt !== undefined && startedAt <= lastCancelledDismissAt)
      return
    if (submitMode.value === 'blur' || submitMode.value === 'both') {
      if (!submit(reason, event)) {
        dismissCancelledInTask = true
        lastCancelledDismissAt = startedAt ?? lastCancelledDismissAt
        setTimeout(() => {
          dismissCancelledInTask = false
        })
      }
    }
    else {
      cancel()
    }
  }

  const context: EditableRootContext = {
    id,
    name,
    disabled,
    isEditing,
    maxLength,
    modelValue,
    inputValue,
    placeholder,
    edit,
    cancel,
    submit,
    activationMode,
    submitMode,
    selectOnFocus,
    inputRef,
    startWithEditMode,
    isEmpty,
    readonly,
    autoResize,
  }

  const root = createPartSurface<Record<string, never>>(() => ({ dir: dir.value }), () => ({}))

  return {
    modelValue,
    inputValue,
    isEditing,
    isEmpty,
    disabled,
    edit,
    cancel,
    submit: submit as UseEditableReturn['submit'],
    dismiss,
    lastChangeDetails,
    isControlled,
    root,
    area: getEditableAreaSurface(context),
    preview: getEditablePreviewSurface(context),
    input: getEditableInputSurface(context),
    editTrigger: getEditableTriggerSurface(context, 'edit'),
    submitTrigger: getEditableTriggerSurface(context, 'submit'),
    cancelTrigger: getEditableTriggerSurface(context, 'cancel'),
    context,
  }
}
