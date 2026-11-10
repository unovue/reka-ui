/**
 * Compile-time type tests for the public Field and Form composables,
 * validated by `vue-tsc` (see `shared/useEmitAsProps.test-d.ts`).
 */
import type { ComputedRef, Ref } from 'vue'
import type { FieldControlState, FieldValidityState, PartSurface, UseFieldControlProps, UseFieldControlReturn, UseFieldReturn, UseFormReturn } from '../index'
import { computed, ref, shallowRef } from 'vue'
import { useField, useFieldControl, useForm } from '../index'

// Assertion helpers
type Expect<T extends true> = T
type Equal<A, B>
  = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

// The value type defaults to `unknown` and flows to `isFilled` and `input`
type _defaultValue = Expect<Equal<Parameters<NonNullable<UseFieldControlProps['isFilled']>>[0], unknown>>
type _typedIsFilled = Expect<Equal<Parameters<NonNullable<UseFieldControlProps<string[]>['isFilled']>>[0], string[]>>
type _typedInput = Expect<Equal<Parameters<UseFieldControlReturn<number>['input']>, [value?: number]>>
type _surface = Expect<Equal<UseFieldControlReturn['control'], PartSurface<FieldControlState>>>
type _id = Expect<Equal<UseFieldControlReturn['id'], ComputedRef<string | undefined>>>

// The read-side returns are refs and plain functions, never the raw context
type _fieldErrors = Expect<Equal<UseFieldReturn['errors'], ComputedRef<string[]>>>
type _fieldValidity = Expect<Equal<UseFieldReturn['validity'], ComputedRef<FieldValidityState>>>
type _fieldValidate = Expect<Equal<UseFieldReturn['validate'], () => boolean>>
type _formValidate = Expect<Equal<UseFormReturn['validate'], (name?: string) => boolean>>
type _formValues = Expect<Equal<ReturnType<UseFormReturn['getValues']>, Record<string, unknown>>>

declare const element: Ref<HTMLElement | undefined>
declare const input: Readonly<Ref<HTMLInputElement | null>>
declare const props: { modelValue?: number, id?: string, disabled?: boolean }

// Never executed: only type-checked
export function _fieldComposableTypeTests() {
  // `T` is inferred from a ref, a computed, a getter or a plain value
  const fromRef = useFieldControl({ value: ref(['a']), element, isFilled: value => value.length > 1 })
  fromRef.input(['b'])
  fromRef.input()
  // @ts-expect-error not the control's value type
  fromRef.input('b')

  const fromGetter = useFieldControl({
    value: () => props.modelValue,
    // A template ref of a native control serves as both elements
    element: input,
    validityElement: input,
    id: () => props.id,
    disabled: () => props.disabled,
    required: computed(() => true),
    name: 'amount',
    isFilled: value => value !== undefined && value > 0,
  })
  fromGetter.input(undefined)
  fromGetter.input(3)

  const fromValue = useFieldControl({ value: shallowRef<Date | null>(null), element: () => element.value })
  fromValue.input(new Date())
  fromValue.input(null)

  // An explicit `T` checks every option against it
  useFieldControl<string>({
    // @ts-expect-error a number is not a string
    value: () => 1,
    element,
  })
  // @ts-expect-error `value` and `element` are required
  useFieldControl({ element })
  // @ts-expect-error not a native form control
  useFieldControl({ value: '', element, validityElement: element })

  // The surface is what `v-bind` takes; state keys are typed
  const state: boolean | null = fromRef.control.state.value.valid
  const attrs: Record<string, any> = fromRef.control.attrs.value
  const disabled: boolean = fromRef.disabled.value
  const name: string | undefined = fromRef.name.value
  // @ts-expect-error read-only
  fromRef.disabled.value = true

  const field = useField()
  const errors: string[] = field.errors.value
  const tooShort: boolean = field.validity.value.tooShort
  const valid: boolean = field.validate()
  field.reset()
  field.focus()
  // @ts-expect-error read-only
  field.touched.value = true
  // @ts-expect-error the registration plumbing is not part of the return
  field.registerControl

  const form = useForm()
  const count: number = form.submitCount.value
  const email: unknown = form.getValues().email
  const allValid: boolean = form.validate()
  const oneValid: boolean = form.validate('email')
  form.reset()
  // @ts-expect-error read-only
  form.submitCount.value = 0
  // @ts-expect-error the registration plumbing is not part of the return
  form.registerField

  return { state, attrs, disabled, name, errors, tooShort, valid, count, email, allValid, oneValid }
}
