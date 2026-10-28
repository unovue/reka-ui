import type { ComputedRef } from 'vue'
import type { CalendarGridData, CalendarUnit } from '@/date'
import type { DateValue } from '@/date/types'
import { computed, shallowReactive, toRaw, watch } from 'vue'
import { getLocalTimeZone, startOfMonth, startOfYear, toCalendar, today, toPlainDate } from '@/date/temporal'

// =============================================================================
// Keyed per-cell state for the calendar grids (Calendar, RangeCalendar and the
// pickers built on them).
//
// A calendar renders 35–42 cells per page. Deriving "is this cell selected /
// focusable / in the range / today" inside every cell made each cell subscribe
// to the whole model, so one press re-ran every cell. Instead the root derives
// those flags once per change, keyed by the cell's date, into a reactive `Map`:
// Vue tracks `map.get(key)` per key, so a change only re-runs the cells whose
// flags actually changed (the old and the new selection, the old and the new
// focus target, the cells entering or leaving the hovered range).
//
// TODO: unify with the shared `createKeyedSelector` (perf/v3-lean-lists) once
// that lands; this is the calendar's local equivalent.
// =============================================================================

/** The cell is selected (Calendar) or inside the committed range, ends included (RangeCalendar). */
export const CELL_SELECTED = 1
/** The cell is where focus should land (`tabindex="0"`), before its own disabled / outside checks. */
export const CELL_FOCUS_TARGET = 1 << 1
/** The cell is today / the current month / the current year. */
export const CELL_TODAY = 1 << 2
export const CELL_SELECTION_START = 1 << 3
export const CELL_SELECTION_END = 1 << 4
export const CELL_HIGHLIGHTED = 1 << 5
export const CELL_HIGHLIGHTED_START = 1 << 6
export const CELL_HIGHLIGHTED_END = 1 << 7
/**
 * The cell is part of the rendered grid, so its range flags were computed by
 * the root (RangeCalendar). A cell without it (a custom cell for a date outside
 * the grid) computes its range flags itself.
 */
export const CELL_IN_GRID = 1 << 8

/**
 * The key of `date` at `unit`: the ISO date of the day, or of the first day of
 * its month / year. Two dates in the same calendar share a key exactly when the
 * unit adapter's `isSame` holds for them (`isSameDay` compares ISO days;
 * `isSameYearMonth` / `isSameYear` compare month / year starts in the calendar
 * of their first argument, which is why month and year keys need both dates
 * in one calendar first).
 */
export function calendarCellKey(date: DateValue, unit: CalendarUnit): string {
  const plain = toPlainDate(date)
  const start = unit === 'day' ? plain : unit === 'month' ? startOfMonth(plain) : startOfYear(plain)
  return start.toString({ calendarName: 'never' })
}

/**
 * A reactive `key → flags` map whose reads are tracked per key. `sync()`
 * replaces the contents and only triggers the keys whose flags changed
 * (Vue skips a `set` to an equal value).
 *
 * @internal
 */
export class KeyedFlags {
  private readonly map = shallowReactive(new Map<string, number>())

  get(key: string): number {
    return this.map.get(key) ?? 0
  }

  sync(next: Map<string, number>) {
    const raw = toRaw(this.map)
    for (const key of raw.keys()) {
      if (!next.has(key))
        this.map.delete(key)
    }
    for (const [key, flags] of next)
      this.map.set(key, flags)
  }
}

/** What a cell needs to read its flags from the root. @internal */
export interface CalendarCellIndex {
  /** The unit the keys are built at: the active view. A cell of another unit computes its flags itself. */
  unit: ComputedRef<CalendarUnit>
  /** The calendar the keys are built in (the placeholder's). A cell in another calendar computes its flags itself. */
  calendarId: ComputedRef<string>
  flags: KeyedFlags
}

/** A rendered cell and its key. */
export interface CalendarGridCellKey { date: DateValue, key: string }

/** Collects flags by key while the root recomputes them. @internal */
export class CalendarCellFlagsBuilder {
  readonly flags = new Map<string, number>()
  constructor(
    readonly unit: CalendarUnit,
    readonly calendarId: string,
    /** The rendered cells (each date once) with their keys; empty unless the index was given the grid. */
    readonly cells: readonly CalendarGridCellKey[] = [],
  ) {}

  key(date: DateValue): string {
    // Day keys are calendar independent; month / year starts are read in the grid's calendar.
    return calendarCellKey(this.unit === 'day' ? date : toCalendar(date, this.calendarId), this.unit)
  }

  add(key: string, flag: number) {
    this.flags.set(key, (this.flags.get(key) ?? 0) | flag)
  }

  addDate(date: DateValue | undefined, flag: number) {
    if (date)
      this.add(this.key(date), flag)
  }
}

export interface CreateCalendarCellIndexOptions {
  /** The active view. */
  view: ComputedRef<CalendarUnit>
  placeholder: { readonly value: DateValue }
  /** The rendered pages, when `collect` needs to walk the cells (`builder.cells`). */
  grid?: { readonly value: CalendarGridData[] }
  /** Adds the family's flags (selection, focus target, range). Runs once per flush in which something it reads changed. */
  collect: (builder: CalendarCellFlagsBuilder) => void
}

/**
 * The root side of the keyed cell state: recomputes the flags when what
 * `collect` reads changed, and publishes them through a `KeyedFlags` map.
 *
 * The recompute is a pre-flush watcher, not a sync one: a press updates the
 * model, the range ends, the placeholder and the focused date one after the
 * other, and a sync recompute would publish every intermediate state (a
 * half-updated range flips a dozen cells and back), re-rendering cells whose
 * final state never changed. Pre-flush jobs run before any component renders,
 * so every render (and the DOM after `nextTick()`) sees the settled flags; a
 * read of a cell surface in the same tick as a model change sees the previous
 * ones, as the DOM does.
 *
 * @lifecycle setup — installs one pre-flush watcher.
 * @internal
 */
export function createCalendarCellIndex(options: CreateCalendarCellIndexOptions): CalendarCellIndex {
  const calendarId = computed(() => options.placeholder.value.calendarId)
  const index: CalendarCellIndex = { unit: options.view, calendarId, flags: new KeyedFlags() }
  const grid = options.grid
  const cells = grid ? useGridCellKeys(grid, index) : undefined
  watch(() => {
    const builder = new CalendarCellFlagsBuilder(options.view.value, calendarId.value, cells?.value)
    options.collect(builder)
    // `isCurrent`: today in the local zone, in the grid's calendar for months and years.
    builder.addDate(today(getLocalTimeZone()), CELL_TODAY)
    return builder.flags
  }, next => index.flags.sync(next), { flush: 'pre', immediate: true })
  return index
}

/**
 * The cells of every rendered page with their keys (each date once), rebuilt
 * only when the grid, the view or the calendar is, not on every flag recompute.
 *
 * @internal
 */
export function useGridCellKeys(grid: { readonly value: CalendarGridData[] }, index: CalendarCellIndex) {
  return computed(() => {
    const builder = new CalendarCellFlagsBuilder(index.unit.value, index.calendarId.value)
    const out: CalendarGridCellKey[] = []
    const seen = new Set<string>()
    for (const page of grid.value) {
      for (const date of page.cells) {
        const key = builder.key(date)
        if (seen.has(key))
          continue
        seen.add(key)
        out.push({ date, key })
      }
    }
    return out
  })
}

const indexes = new WeakMap<object, CalendarCellIndex>()

/** Registers the cell index of a root context, for its cells to read. @internal */
export function setCalendarCellIndex(context: object, index: CalendarCellIndex) {
  indexes.set(context, index)
}

/** The cell index of a root context; `undefined` for a context built without one (its cells compute their flags themselves). @internal */
export function getCalendarCellIndex(context: object): CalendarCellIndex | undefined {
  return indexes.get(context)
}

/**
 * The flags of the cell for `date` at `unit`, or `undefined` when the root's
 * index cannot answer for it (another unit or calendar than the index's, or
 * no index), in which case the cell evaluates its predicates directly.
 *
 * @internal
 */
export function readCalendarCellFlags(index: CalendarCellIndex | undefined, date: DateValue, unit: CalendarUnit): number | undefined {
  if (!index || unit !== index.unit.value || date.calendarId !== index.calendarId.value)
    return undefined
  return index.flags.get(calendarCellKey(date, unit))
}
