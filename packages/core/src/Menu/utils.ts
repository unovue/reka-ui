import type { MenuContentHideEvent } from './MenuRoot.vue'
import { getCurrentScope, onScopeDispose } from 'vue'
import { containsComposed, getActiveElement } from '@/shared'

export type CheckedState = boolean | 'indeterminate'
export type Direction = 'ltr' | 'rtl'

export const ITEM_NAME = 'MenuItem'
export const ITEM_SELECT = 'menu.itemSelect'
export const SELECTION_KEYS = ['Enter', ' ']
export const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home']
export const LAST_KEYS = ['ArrowUp', 'PageDown', 'End']
export const FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS]
export const SUB_OPEN_KEYS: Record<Direction, string[]> = {
  ltr: [...SELECTION_KEYS, 'ArrowRight'],
  rtl: [...SELECTION_KEYS, 'ArrowLeft'],
}
export const SUB_CLOSE_KEYS: Record<Direction, string[]> = {
  ltr: ['ArrowLeft'],
  rtl: ['ArrowRight'],
}

/** Why a menu checkbox item's checked state changed: a click, Enter or Space on the item. */
export type MenuCheckboxItemChangeReason = 'item-press'
/** Why a menu radio group's value changed: a click, Enter or Space on one of its items. */
export type MenuRadioGroupChangeReason = 'item-press'

/** The native event behind a menu item's `select` CustomEvent, if any. */
export function getItemSelectOriginalEvent(event: Event): Event | undefined {
  return (event as CustomEvent<{ originalEvent?: Event } | null>).detail?.originalEvent
}

export function isIndeterminate(
  checked?: CheckedState,
): checked is 'indeterminate' {
  return checked === 'indeterminate'
}

/**
 * `entryFocus` is internal to the menu content wrappers (DropdownMenu, ContextMenu, Menubar),
 * so drop a consumer's `@entry-focus` listener instead of letting it fall through to `MenuContent`.
 */
export function omitEntryFocusListener(attrs: Record<string, unknown>) {
  const { onEntryFocus: _, onEntryFocusOnce: __, ...rest } = attrs
  return rest
}

export function focusFirst(candidates: HTMLElement[]) {
  const PREVIOUSLY_FOCUSED_ELEMENT = getActiveElement()
  for (const candidate of candidates) {
    // if focus is already where we want to go, we don't want to keep going through the candidates
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT)
      return
    candidate.focus()
    if (getActiveElement() !== PREVIOUSLY_FOCUSED_ELEMENT)
      return
  }
}

export interface Point {
  x: number
  y: number
}
export type Polygon = Point[]
export type Side = 'left' | 'right'
export interface GraceIntent {
  area: Polygon
  side: Side
}

// Determine if a point is inside of a polygon.
// Based on https://github.com/substack/point-in-polygon
export function isPointInPolygon(point: Point, polygon: Polygon) {
  const { x, y } = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect)
      inside = !inside
  }

  return inside
}

export function isPointerInGraceArea(event: PointerEvent, area?: Polygon) {
  if (!area)
    return false
  const cursorPos = { x: event.clientX, y: event.clientY }
  return isPointInPolygon(cursorPos, area)
}

export function isMouseEvent(event: PointerEvent) {
  return event.pointerType === 'mouse'
}

/**
 * A minimal event hook for `MenuContext.onContentHide` / `contentHidden`: the
 * handlers of the parts that return focus when a kept-mounted content hides.
 * Inside a scope a handler is removed with it.
 */
export function createContentHideHook() {
  const handlers = new Set<(event: MenuContentHideEvent) => void>()
  return {
    on(handler: (event: MenuContentHideEvent) => void) {
      handlers.add(handler)
      if (getCurrentScope())
        onScopeDispose(() => handlers.delete(handler))
    },
    trigger(event: MenuContentHideEvent) {
      handlers.forEach(handler => handler(event))
    },
  }
}

/**
 * Whether focus moved on, out of `container`, to another element (another layer
 * opened), so a kept-mounted content that hides must not take it back. Focus on
 * the body (the hidden content had it), inside the container or inside one of
 * `related` (the contents of the same menu's submenus, which may be portalled) has not.
 */
export function hasFocusLeftContent(container: HTMLElement | undefined, related?: Iterable<HTMLElement>): boolean {
  const ownerDocument = container?.ownerDocument
  if (!ownerDocument)
    return false
  let activeElement = ownerDocument.activeElement
  while (activeElement?.shadowRoot?.activeElement)
    activeElement = activeElement.shadowRoot.activeElement
  if (!activeElement || activeElement === ownerDocument.body || activeElement === ownerDocument.documentElement)
    return false
  if (containsComposed(container!, activeElement))
    return false
  for (const element of related ?? []) {
    if (containsComposed(element, activeElement))
      return false
  }
  return true
}
