import type { MenuContentHideEvent, MenuContext } from './MenuRoot.vue'
import { getCurrentScope, onScopeDispose, toRaw } from 'vue'
import { getActiveElement } from '@/shared'

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

type ContentHideHandler = (event: MenuContentHideEvent) => void

// The handlers per menu context, created with the first one: a menu whose content never
// mounts has none, and nothing per menu is allocated for them.
const contentHideHandlers = new WeakMap<object, Set<ContentHideHandler>>()

/**
 * Adds a handler of a part that returns focus when the kept-mounted content of the menu with
 * `context` hides. Inside a scope the handler is removed with it.
 */
export function onContentHide(context: object, handler: ContentHideHandler) {
  context = toRaw(context)
  let handlers = contentHideHandlers.get(context)
  if (!handlers)
    contentHideHandlers.set(context, handlers = new Set())
  handlers.add(handler)
  if (getCurrentScope())
    onScopeDispose(() => handlers.delete(handler))
}

/** Calls the content-hide handlers of the menu with `context`. */
export function contentHidden(context: object, event: MenuContentHideEvent) {
  contentHideHandlers.get(toRaw(context))?.forEach(handler => handler(event))
}

type ContentHideHooks = Pick<MenuContext, 'onContentHide' | 'contentHidden'>

// `MenuContext.onContentHide` / `contentHidden` bound to their context, created on the first
// read: the parts call the functions above, so only a consumer reading the hooks pays for them.
const boundContentHideHooks = new WeakMap<object, ContentHideHooks>()

function contentHideHooks(context: object): ContentHideHooks {
  context = toRaw(context)
  let hooks = boundContentHideHooks.get(context)
  if (!hooks) {
    boundContentHideHooks.set(context, hooks = {
      onContentHide: handler => onContentHide(context, handler),
      contentHidden: event => contentHidden(context, event),
    })
  }
  return hooks
}

// The class of every menu context: its hide hooks are getters on the prototype, so a menu holds
// no functions for them, and they still work destructured. A class rather than
// `Object.create(prototype)`: its instances keep every field in the object itself.
class MenuContextBase {
  constructor(fields: object) {
    Object.assign(this, fields)
  }

  get onContentHide(): MenuContext['onContentHide'] {
    return contentHideHooks(this).onContentHide
  }

  get contentHidden(): MenuContext['contentHidden'] {
    return contentHideHooks(this).contentHidden
  }
}

/** Creates a menu context: `fields` with the content-hide hooks. */
export function createMenuContext(fields: Omit<MenuContext, keyof ContentHideHooks>): MenuContext {
  return new MenuContextBase(fields) as MenuContext
}
