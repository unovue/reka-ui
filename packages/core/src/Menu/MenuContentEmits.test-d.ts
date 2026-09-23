import type { MenuContentEmits } from './MenuContent.vue'
/**
 * Compile-time type tests for the public menu content emits, validated by
 * `vue-tsc` (see `shared/useEmitAsProps.test-d.ts`).
 *
 * `MenuContent` exposes both focus events. The DropdownMenu, ContextMenu and
 * Menubar wrappers keep `openAutoFocus` public but hide `entryFocus`, which
 * they handle internally (matching Radix).
 */
import type { ContextMenuContentEmits } from '@/ContextMenu'
import type { DropdownMenuContentEmits } from '@/DropdownMenu'
import type { MenubarContentEmits } from '@/Menubar'

type Expect<T extends true> = T
type Has<T, K extends PropertyKey> = K extends keyof T ? true : false
type Lacks<T, K extends PropertyKey> = K extends keyof T ? false : true

export type Tests = [
  Expect<Has<MenuContentEmits, 'openAutoFocus'>>,
  Expect<Has<MenuContentEmits, 'entryFocus'>>,

  Expect<Has<DropdownMenuContentEmits, 'openAutoFocus'>>,
  Expect<Lacks<DropdownMenuContentEmits, 'entryFocus'>>,
  Expect<Has<DropdownMenuContentEmits, 'closeAutoFocus'>>,

  Expect<Has<ContextMenuContentEmits, 'openAutoFocus'>>,
  Expect<Lacks<ContextMenuContentEmits, 'entryFocus'>>,

  Expect<Has<MenubarContentEmits, 'openAutoFocus'>>,
  Expect<Lacks<MenubarContentEmits, 'entryFocus'>>,
]
