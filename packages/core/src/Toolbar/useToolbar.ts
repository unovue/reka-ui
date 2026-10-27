import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ToolbarRootContext } from './ToolbarRoot.vue'
import type { PartSurface } from '@/shared'
import type { DataOrientation, Direction } from '@/shared/types'
import { computed, toValue } from 'vue'
import { createPartSurface } from '@/shared'

/** Semantic state of a toolbar button (none rendered: v2 had no `data-*` on it). */
export type ToolbarButtonState = { disabled: boolean }

/** The `role="toolbar"` surface, derived purely from the context. */
export function getToolbarRootSurface(context: ToolbarRootContext): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({ 'role': 'toolbar', 'aria-orientation': context.orientation.value }),
    () => ({}),
  )
}

/** The `ToolbarButton` surface: the native `disabled`. `type` is tag-dependent and stays in the shell. */
export function getToolbarButtonSurface(disabled?: MaybeRefOrGetter<boolean | undefined>): PartSurface<ToolbarButtonState> {
  const isDisabled = computed(() => toValue(disabled) ?? false)
  return createPartSurface<ToolbarButtonState>(
    () => ({ disabled: isDisabled.value }),
    () => ({ disabled: isDisabled.value }),
    // v2 rendered only the native `disabled` attribute on toolbar buttons.
    { disabled: () => undefined },
  )
}

/** The `ToolbarLink` surface: Space activates the link, as Enter does natively. */
export function getToolbarLinkSurface(): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({
      onKeydown: (event: KeyboardEvent) => {
        if (event.key === ' ')
          (event.currentTarget as HTMLElement)?.click()
      },
    }),
    () => ({}),
  )
}

export interface UseToolbarProps {
  /** @defaultValue `'horizontal'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
}

export interface UseToolbarReturn {
  /** The `role="toolbar"` surface. */
  root: PartSurface<Record<string, never>>
  /** The link surface (Space activates it). */
  link: PartSurface<Record<string, never>>
  /** Per-button surface. */
  getButtonSurface: (disabled?: MaybeRefOrGetter<boolean | undefined>) => PartSurface<ToolbarButtonState>
  context: ToolbarRootContext
}

/**
 * Headless Toolbar logic. Toolbar has no model: it is a `role="toolbar"`
 * container whose arrow-key navigation comes from `RovingFocusGroup` /
 * `RovingFocusItem`, component wrappers a composable cannot absorb. A
 * standalone consumer gets the roles, `aria-orientation` and the link's Space
 * activation, and must wrap the items in `RovingFocusGroup` itself.
 *
 * `ToolbarToggleGroup` is a `ToggleGroupRoot` with roving focus turned off:
 * its value goes through `useToggleGroup()` (`ToggleGroupChangeReason`,
 * cancellable `beforeUpdate:modelValue`).
 *
 * SSR-safe and callable outside `setup()` (computed-only).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useToolbar(props: UseToolbarProps = {}): UseToolbarReturn {
  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')

  const context: ToolbarRootContext = {
    orientation: orientation as Ref<DataOrientation>,
    dir: dir as Ref<Direction>,
  }

  return {
    root: getToolbarRootSurface(context),
    link: getToolbarLinkSurface(),
    getButtonSurface: getToolbarButtonSurface,
    context,
  }
}
