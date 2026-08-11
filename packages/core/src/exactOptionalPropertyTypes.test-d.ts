/**
 * Type-level regression guard for `exactOptionalPropertyTypes`.
 *
 * Consumers compiling with the flag on cannot pass an explicit `undefined` into
 * an optional property whose type omits it, so
 * `<AccordionRoot :model-value="maybeUndefined" />` stops type-checking as soon
 * as one prop is declared `modelValue?: string` instead of
 * `modelValue?: string | undefined`.
 *
 * The assertion below walks the props of every component exported from the
 * package entry and fails `pnpm type-check` with the offending component/prop
 * pairs, so a new component cannot silently regress the guarantee. Exports that
 * are not components are covered by the `reka/add-undef-to-optional` ESLint
 * rule, which requires the same of every optional property in the repository.
 *
 * This file is checked by `vue-tsc`; it is never executed and never published.
 */
import type { AllowedComponentProps, ComponentCustomProps, VNodeProps } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'
import type * as Reka from './index'

/**
 * Props that are not ours to fix:
 * - `key`, `class`, `ref`, … come from `@vue/runtime-core` and are declared
 *   there without `| undefined`.
 * - `on*` props are generated from `defineEmits()` by Vue's `EmitsToProps`,
 *   which likewise drops `undefined`; declaring the emits differently cannot
 *   change it.
 */
type IgnoredProps = keyof VNodeProps | keyof AllowedComponentProps | keyof ComponentCustomProps | `on${string}`

/** Keys of `T` that the caller may omit. */
type OptionalKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? K : never
}[keyof T]

/**
 * Optional keys of `T` that reject an explicit `undefined` — `never` for a type
 * whose optional properties are all declared `prop?: T | undefined`.
 */
type PropsRejectingUndefined<T, Keys extends keyof T = Exclude<OptionalKeys<T>, IgnoredProps>> = {
  [K in Keys]-?: { [P in K]: undefined } extends Pick<T, K> ? never : K
}[Keys]

/**
 * Drops the `Record<string, any>` index signature `ComponentProps` adds for
 * generic components, which would otherwise swallow every declared key.
 */
type KnownKeys<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
}

/**
 * Props of every component exported from `src/index.ts`, keyed by export name.
 * Components are the PascalCase exports; `injectFooContext` / `useFoo` helpers
 * are filtered out.
 */
type ExportedComponentProps = {
  [K in keyof typeof Reka as K extends Capitalize<K & string> ? K : never]:
  KnownKeys<ComponentProps<(typeof Reka)[K]>>
}

/** The components that still declare an optional prop without `| undefined`. */
type Offenders = {
  [K in keyof ExportedComponentProps as PropsRejectingUndefined<ExportedComponentProps[K]> extends never
    ? never
    : K]: PropsRejectingUndefined<ExportedComponentProps[K]>
}

type Assert<T extends true> = T

type NoOffenders<T> = keyof T extends never
  ? true
  : { 'optional props must be declared `prop?: T | undefined`': { [K in keyof T]: T[K] } }

export type _OptionalPropsAcceptUndefined = Assert<NoOffenders<Offenders>>
