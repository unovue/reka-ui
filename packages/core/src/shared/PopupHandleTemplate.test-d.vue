<script setup lang="ts">
/**
 * Compile-time template tests for detached-trigger handles (#2826), validated
 * by `vue-tsc` (`pnpm type-check`); never rendered. A typed handle is accepted
 * by every Root and Trigger, the Trigger's `payload` is checked against it, and
 * the Root's slot `payload` is exactly `Item | undefined`.
 */
import { AlertDialogRoot, AlertDialogTrigger, createAlertDialogHandle } from '@/AlertDialog'
import { createDialogHandle, DialogRoot, DialogTrigger } from '@/Dialog'
import { createDropdownMenuHandle, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { createPopoverHandle, PopoverRoot, PopoverTrigger } from '@/Popover'

interface Item { name: string }

const popover = createPopoverHandle<Item>()
const dialog = createDialogHandle<Item>()
const alert = createAlertDialogHandle<Item>()
const menu = createDropdownMenuHandle<Item>()
const item: Item = { name: 'Ada' }

/** Compiles only when `value` is exactly `Item | undefined` (not `unknown`, not `any`-narrowed). */
function exactlyItem<T extends Item | undefined>(value: T & ([Item | undefined] extends [T] ? unknown : never)): string {
  return value?.name ?? ''
}
</script>

<template>
  <PopoverTrigger
    :handle="popover"
    :payload="item"
  />
  <!-- @vue-expect-error the payload must match the handle's -->
  <PopoverTrigger
    :handle="popover"
    :payload="42"
  />
  <PopoverRoot
    v-slot="{ payload }"
    :handle="popover"
  >
    {{ exactlyItem(payload) }}
  </PopoverRoot>

  <DialogTrigger
    :handle="dialog"
    :payload="item"
  />
  <!-- @vue-expect-error the payload must match the handle's -->
  <DialogTrigger
    :handle="dialog"
    :payload="42"
  />
  <DialogRoot
    v-slot="{ payload }"
    :handle="dialog"
  >
    {{ exactlyItem(payload) }}
  </DialogRoot>

  <AlertDialogTrigger
    :handle="alert"
    :payload="item"
  />
  <!-- @vue-expect-error a DialogHandle is not an AlertDialogHandle -->
  <AlertDialogRoot :handle="dialog" />
  <AlertDialogRoot
    v-slot="{ payload }"
    :handle="alert"
  >
    {{ exactlyItem(payload) }}
  </AlertDialogRoot>

  <DropdownMenuTrigger
    :handle="menu"
    :payload="item"
  />
  <!-- @vue-expect-error a PopoverHandle is not a DropdownMenuHandle -->
  <DropdownMenuRoot :handle="popover" />
  <DropdownMenuRoot
    v-slot="{ payload }"
    :handle="menu"
  >
    {{ exactlyItem(payload) }}
  </DropdownMenuRoot>
</template>
