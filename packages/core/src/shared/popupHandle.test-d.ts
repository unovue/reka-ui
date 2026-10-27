import type { AlertDialogHandle } from '@/AlertDialog'
import type { DialogHandle } from '@/Dialog'
import type { DropdownMenuHandle } from '@/DropdownMenu'
import type { PopoverHandle } from '@/Popover'
import { h } from 'vue'
import { AlertDialogRoot, AlertDialogTrigger, createAlertDialogHandle } from '@/AlertDialog'
import { createDialogHandle, DialogRoot, DialogTrigger } from '@/Dialog'
import { createDropdownMenuHandle, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { createPopoverHandle, PopoverRoot, PopoverTrigger } from '@/Popover'

/**
 * Compile-time type tests for detached-trigger handles (#2826), validated by
 * `vue-tsc` (see `shared/useEmitAsProps.test-d.ts`). Template inference and the
 * typed slot `payload` are covered by `PopupHandleTemplate.test-d.vue`.
 *
 * A handle is covariant in its payload: `h()` cannot infer a generic SFC's
 * type parameter and falls back to `Payload = unknown`, so a typed handle must
 * be assignable to the `unknown` one.
 */

type Expect<T extends true> = T
type Extends<A, B> = [A] extends [B] ? true : false
type Not<T extends boolean> = T extends true ? false : true

interface Item { name: string }

export type Tests = [
  // Typed handles widen to `unknown` (the props of a non-inferred generic Root / Trigger).
  Expect<Extends<PopoverHandle<Item>, PopoverHandle<unknown>>>,
  Expect<Extends<DialogHandle<Item>, DialogHandle<unknown>>>,
  Expect<Extends<AlertDialogHandle<Item>, AlertDialogHandle<unknown>>>,
  Expect<Extends<DropdownMenuHandle<Item>, DropdownMenuHandle<unknown>>>,

  // ...but not the other way round, nor to an unrelated payload.
  Expect<Not<Extends<PopoverHandle<unknown>, PopoverHandle<Item>>>>,
  Expect<Not<Extends<PopoverHandle<Item>, PopoverHandle<number>>>>,

  // Families stay apart; an AlertDialogHandle is a DialogHandle, not the reverse.
  Expect<Not<Extends<DialogHandle<Item>, PopoverHandle<Item>>>>,
  Expect<Not<Extends<PopoverHandle<Item>, DropdownMenuHandle<Item>>>>,
  Expect<Extends<AlertDialogHandle<Item>, DialogHandle<Item>>>,
  Expect<Not<Extends<DialogHandle<Item>, AlertDialogHandle<Item>>>>,
]

// A typed handle is accepted through `h()` (render functions, tests).
const popover = createPopoverHandle<Item>()
const dialog = createDialogHandle<Item>()
const alert = createAlertDialogHandle<Item>()
const menu = createDropdownMenuHandle<Item>()
export const vnodes = [
  h(PopoverTrigger, { handle: popover, payload: { name: 'Ada' } }),
  h(PopoverRoot, { handle: popover }),
  h(DialogTrigger, { handle: dialog, payload: { name: 'Ada' } }),
  h(DialogRoot, { handle: dialog }),
  h(AlertDialogTrigger, { handle: alert, payload: { name: 'Ada' } }),
  h(AlertDialogRoot, { handle: alert }),
  h(DropdownMenuTrigger, { handle: menu, payload: { name: 'Ada' } }),
  h(DropdownMenuRoot, { handle: menu }),
]
