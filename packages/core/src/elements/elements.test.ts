import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { CalendarRoot } from '@/Calendar'
import { CheckboxGroupRoot } from '@/Checkbox'
import { DatePickerField } from '@/DatePicker'
import { DialogRoot } from '@/Dialog'
import { NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PopoverContent } from '@/Popover'
import { SwitchRoot } from '@/Switch'
import * as source from '.'
import { defineRekaElements, rekaElementFamilies, toEventType } from '.'
import { cleanup, query, render } from './elements.test.helpers'
import { getPartMeta, parseAttribute } from './meta'

describe('attribute and event mapping', () => {
  it('derives attributes and properties from the runtime props', () => {
    const meta = getPartMeta({ component: SwitchRoot, attributes: { modelValue: 'booleanish' } })
    expect(meta.observedAttributes).toEqual(expect.arrayContaining(['model-value', 'default-value', 'disabled', 'name', 'id']))
    // `as` / `asChild` are not part of the element API.
    expect(meta.observedAttributes).not.toContain('as-child')
    expect(meta.properties).not.toContain('asChild')
    // `id` stays the native property, read through the attribute.
    expect(meta.properties).not.toContain('id')
    expect(meta.properties).toContain('modelValue')
    expect(meta.emits).toEqual(['beforeUpdate:modelValue', 'update:modelValue'])
    expect(meta.semantics).toEqual({ role: 'button', button: true })
    expect(meta.formAssociated).toBe(true)
  })

  it('leaves array, object and element props to properties', () => {
    expect(getPartMeta({ component: CheckboxGroupRoot }).observedAttributes).not.toContain('model-value')
    const popover = getPartMeta({ component: PopoverContent, attributes: { reference: 'property' } })
    expect(popover.observedAttributes).not.toContain('reference')
    expect(popover.observedAttributes).toContain('side-offset')
    expect(popover.byAttribute.get('side-offset')?.kind).toBe('number')
  })

  it('parses attribute values by kind', () => {
    const open = { kind: 'boolean', attribute: 'open' } as const
    expect(parseAttribute(open, '')).toBe(true)
    expect(parseAttribute(open, 'open')).toBe(true)
    // HTML boolean attribute: present means `true`, whatever the value.
    expect(parseAttribute(open, 'false')).toBe(true)
    expect(parseAttribute(open, null)).toBeUndefined()
    // Only a prop that defaults to `true` can be turned off with `"false"`.
    const modal = { kind: 'boolean', attribute: 'modal', defaultTrue: true } as const
    expect(parseAttribute(modal, 'false')).toBe(false)
    expect(parseAttribute(modal, '')).toBe(true)
    const modelValue = { kind: 'booleanish', attribute: 'model-value' } as const
    expect(parseAttribute(modelValue, '')).toBe(true)
    expect(parseAttribute(modelValue, 'false')).toBe(false)
    expect(parseAttribute(modelValue, 'indeterminate')).toBe('indeterminate')
    const sideOffset = { kind: 'number', attribute: 'side-offset' } as const
    expect(parseAttribute(sideOffset, '8')).toBe(8)
    expect(parseAttribute(sideOffset, 'x')).toBeUndefined()
    expect(parseAttribute({ kind: 'string', attribute: 'value' }, 'a')).toBe('a')
  })

  it('parses number lists and ISO 8601 dates, times and intervals into Temporal values', () => {
    const numbers = { kind: 'numbers', attribute: 'default-value' } as const
    expect(parseAttribute(numbers, '10 90')).toEqual([10, 90])
    expect(parseAttribute(numbers, '10,90')).toEqual([10, 90])
    expect(parseAttribute(numbers, '10 x')).toBeUndefined()

    const date = { kind: 'date', attribute: 'default-value' } as const
    expect(parseAttribute(date, '2026-10-14')).toBeInstanceOf(Temporal.PlainDate)
    expect(parseAttribute(date, '2026-10-14T09:30')).toBeInstanceOf(Temporal.PlainDateTime)
    const zoned = parseAttribute(date, '2026-10-14T09:30+02:00[Europe/Paris]') as Temporal.ZonedDateTime
    expect(zoned).toBeInstanceOf(Temporal.ZonedDateTime)
    expect(zoned.timeZoneId).toBe('Europe/Paris')
    expect(parseAttribute(date, '')).toBeUndefined()

    const time = { kind: 'time', attribute: 'default-value' } as const
    expect(parseAttribute(time, '09:30')).toBeInstanceOf(Temporal.PlainTime)
    expect(String(parseAttribute(time, '09:30'))).toBe('09:30:00')
    expect(parseAttribute(time, '2026-10-14T09:30')).toBeInstanceOf(Temporal.PlainDateTime)

    const range = parseAttribute({ kind: 'date-range', attribute: 'default-value' }, '2026-10-05/2026-10-07') as Record<string, unknown>
    expect(Object.keys(range)).toEqual(['start', 'end'])
    expect(String(range.start)).toBe('2026-10-05')
    expect(String(range.end)).toBe('2026-10-07')
    const times = parseAttribute({ kind: 'time-range', attribute: 'default-value' }, '09:00/17:30') as Record<string, unknown>
    expect(String(times.end)).toBe('17:30:00')
    // The `/` of a time zone name is not the interval's.
    const zonedRange = parseAttribute({ kind: 'date-range', attribute: 'default-value' }, '2026-10-05T09:00+02:00[Europe/Paris]/2026-10-07T09:00+02:00[Europe/Paris]') as Record<string, Temporal.ZonedDateTime>
    expect(zonedRange.start.timeZoneId).toBe('Europe/Paris')
    expect(zonedRange.end.day).toBe(7)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseAttribute(date, '2026-13-45')).toBeUndefined()
    expect(parseAttribute({ kind: 'date-range', attribute: 'default-value' }, '2026-10-05')).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  it('reads the part hints: input and svg targets, content kept inside, `asChild` and forms', () => {
    const input = getPartMeta({ component: NumberFieldInput, target: 'input' })
    expect(input.target).toBe('input')
    expect(input.siblingsInside).toBe(false)
    expect(getPartMeta({ component: CalendarRoot, siblingsInside: true }).siblingsInside).toBe(true)
    // A wrapping part without its own `asChild` prop can still declare it passes it through.
    expect(getPartMeta({ component: DatePickerField }).hasAsChild).toBe(false)
    const field = getPartMeta({ component: DatePickerField, asChild: true, formAssociated: true })
    expect(field.hasAsChild).toBe(true)
    expect(field.formAssociated).toBe(true)
    // A `name` prop makes a part form-associated by itself.
    expect(getPartMeta({ component: NumberFieldRoot }).formAssociated).toBe(true)
  })

  it('lets only props that default to `true` take `"false"`, never native attribute names', () => {
    const dialog = getPartMeta({ component: DialogRoot })
    expect(dialog.byAttribute.get('modal')?.defaultTrue).toBe(true)
    expect(dialog.byAttribute.get('open')?.defaultTrue).toBeUndefined()
    expect(getPartMeta({ component: SwitchRoot }).byAttribute.get('disabled')?.defaultTrue).toBeUndefined()
  })

  it('names events in kebab-case, without colons', () => {
    expect(toEventType('update:modelValue')).toBe('update-model-value')
    expect(toEventType('beforeUpdate:open')).toBe('before-update-open')
    expect(toEventType('escapeKeyDown')).toBe('escape-key-down')
  })
})

// The bindings the guide documents for rendering the elements from Vue templates.
describe('bound from a Vue template', () => {
  beforeAll(() => {
    defineRekaElements([source.switchElements], { prefix: 'vuet' })
  })

  it.each([
    [':modelValue', true],
    [':model-value.camel.prop', true],
    [':modelValue.prop', true],
    // Without `.camel`, `.prop` sets a `model-value` property, not `modelValue`.
    [':model-value.prop', false],
  ])('`%s` sets the `modelValue` property: %s', (binding, sets) => {
    const wrapper = mount({ template: `<vuet-switch-root ${binding}="true" />` }, {
      attachTo: document.body,
      global: { config: { compilerOptions: { isCustomElement: (tag: string) => tag.startsWith('vuet-') } } },
    })
    const el = wrapper.element as HTMLElement & { modelValue?: unknown }
    expect(el.modelValue === true).toBe(sets)
    wrapper.unmount()
  })
})

describe('accessibility (axe)', () => {
  beforeAll(() => {
    defineRekaElements(rekaElementFamilies)
  })
  afterEach(cleanup)

  async function mounted(selector: string) {
    await vi.waitFor(() => expect(query(selector).hasAttribute('data-reka-unmounted')).toBe(false))
  }

  it('form controls', async () => {
    // Labelled directly: jsdom has no `innerText`, which the switch reads its
    // `<label for>` text with (the browser suite covers that path).
    const container = render(`
      <form>
        <reka-switch-root aria-label="Wi-Fi" name="wifi"><reka-switch-thumb></reka-switch-thumb></reka-switch-root>
        <reka-checkbox-root aria-label="Accept" default-value><reka-checkbox-indicator>✓</reka-checkbox-indicator></reka-checkbox-root>
        <reka-toggle aria-label="Bold">B</reka-toggle>
      </form>
    `)
    await mounted('reka-checkbox-indicator')
    await mounted('reka-toggle')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('tabs', async () => {
    const container = render(`
      <reka-tabs-root default-value="one">
        <reka-tabs-list aria-label="Settings">
          <reka-tabs-trigger value="one">One</reka-tabs-trigger>
          <reka-tabs-trigger value="two">Two</reka-tabs-trigger>
        </reka-tabs-list>
        <reka-tabs-content value="one">Panel one</reka-tabs-content>
        <reka-tabs-content value="two">Panel two</reka-tabs-content>
      </reka-tabs-root>
    `)
    await mounted('reka-tabs-content[value="one"]')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('accordion and collapsible', async () => {
    const container = render(`
      <reka-accordion-root type="single" default-value="a">
        <reka-accordion-item value="a">
          <reka-accordion-header><reka-accordion-trigger>First</reka-accordion-trigger></reka-accordion-header>
          <reka-accordion-content>First panel</reka-accordion-content>
        </reka-accordion-item>
      </reka-accordion-root>
      <reka-collapsible-root default-open>
        <reka-collapsible-trigger>Details</reka-collapsible-trigger>
        <reka-collapsible-content>Body</reka-collapsible-content>
      </reka-collapsible-root>
    `)
    await mounted('reka-accordion-content')
    await mounted('reka-collapsible-content')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('an open dialog', async () => {
    render(`
      <reka-dialog-root default-open>
        <reka-dialog-trigger>Edit profile</reka-dialog-trigger>
        <reka-dialog-portal>
          <reka-dialog-overlay></reka-dialog-overlay>
          <reka-dialog-content>
            <reka-dialog-title>Edit profile</reka-dialog-title>
            <reka-dialog-description>Make changes to your profile.</reka-dialog-description>
            <reka-dialog-close>Save</reka-dialog-close>
          </reka-dialog-content>
        </reka-dialog-portal>
      </reka-dialog-root>
    `)
    await mounted('reka-dialog-close')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('an open popover', async () => {
    render(`
      <reka-popover-root default-open>
        <reka-popover-trigger>Settings</reka-popover-trigger>
        <reka-popover-portal>
          <reka-popover-content>
            <reka-popover-close aria-label="Close">×</reka-popover-close>
          </reka-popover-content>
        </reka-popover-portal>
      </reka-popover-root>
    `)
    await mounted('reka-popover-close')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('a calendar rendered from its slot props', async () => {
    const container = render(`
      <reka-calendar-root default-value="2026-10-14" locale="en-US">
        <reka-calendar-header>
          <reka-calendar-prev aria-label="Previous month">‹</reka-calendar-prev>
          <reka-calendar-heading></reka-calendar-heading>
          <reka-calendar-next aria-label="Next month">›</reka-calendar-next>
        </reka-calendar-header>
      </reka-calendar-root>
    `)
    const root = query<HTMLElement & { slotProps?: { grid: { value: unknown, rows: unknown[][] }[], weekDays: string[] } }>('reka-calendar-root')
    await vi.waitFor(() => expect(root.slotProps).toBeDefined())
    const { grid, weekDays } = root.slotProps!
    root.insertAdjacentHTML('beforeend', grid.map(month => `
      <reka-calendar-grid value="${month.value}">
        <reka-calendar-grid-head><reka-calendar-grid-row>${weekDays.map(day => `<reka-calendar-head-cell>${day}</reka-calendar-head-cell>`).join('')}</reka-calendar-grid-row></reka-calendar-grid-head>
        <reka-calendar-grid-body>${month.rows.map(row => `<reka-calendar-grid-row>${row.map(date => `<reka-calendar-cell value="${date}"><reka-calendar-cell-trigger value="${date}">${String(date).slice(8)}</reka-calendar-cell-trigger></reka-calendar-cell>`).join('')}</reka-calendar-grid-row>`).join('')}</reka-calendar-grid-body>
      </reka-calendar-grid>`).join(''))
    await vi.waitFor(() => expect(query('reka-calendar-cell-trigger[value="2026-10-14"]').hasAttribute('data-selected')).toBe(true))
    // The grid is a `role="application"` table, as in the Vue component. There
    // its rows are native `<tr>`s, whose implicit role axe does not check; an
    // element's row role is explicit, and axe wants a table or grid around it.
    expect(await axe(container, { rules: { 'aria-required-parent': { enabled: false } } })).toHaveNoViolations()
  })

  it('a date field', async () => {
    const container = render(`<reka-date-field-root default-value="2026-10-14" locale="en-US" aria-label="Birthday"></reka-date-field-root>`)
    const root = query<HTMLElement & { slotProps?: { segments: { part: string, value: string }[] } }>('reka-date-field-root')
    await vi.waitFor(() => expect(root.slotProps).toBeDefined())
    root.innerHTML = root.slotProps!.segments.map(segment => `<reka-date-field-input part="${segment.part}">${segment.value}</reka-date-field-input>`).join('')
    await vi.waitFor(() => expect(query('[data-reka-date-field-segment="day"]').getAttribute('aria-valuenow')).toBe('14'))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('numeric and color inputs', async () => {
    // jsdom has no `ResizeObserver`, which the slider measures its thumbs with.
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    const container = render(`
      <form>
        <reka-number-field-root name="n" default-value="2">
          <reka-number-field-decrement aria-label="Less">−</reka-number-field-decrement>
          <reka-number-field-input><input aria-label="Quantity"></reka-number-field-input>
          <reka-number-field-increment aria-label="More">+</reka-number-field-increment>
        </reka-number-field-root>
        <reka-pin-input-root aria-label="Code">
          <reka-pin-input-input index="0"><input aria-label="Digit 1"></reka-pin-input-input>
          <reka-pin-input-input index="1"><input aria-label="Digit 2"></reka-pin-input-input>
        </reka-pin-input-root>
        <reka-slider-root default-value="50"><reka-slider-track><reka-slider-range></reka-slider-range></reka-slider-track><reka-slider-thumb aria-label="Volume"></reka-slider-thumb></reka-slider-root>
        <reka-rating-root default-value="2" aria-label="Score">
          <reka-rating-item item="1"><reka-rating-item-indicator step="1" aria-label="1 star">★</reka-rating-item-indicator></reka-rating-item>
          <reka-rating-item item="2"><reka-rating-item-indicator step="2" aria-label="2 stars">★</reka-rating-item-indicator></reka-rating-item>
        </reka-rating-root>
        <reka-color-field-root default-value="#ff0000"><reka-color-field-input><input aria-label="Color"></reka-color-field-input></reka-color-field-root>
        <reka-color-swatch color="#00ff00"></reka-color-swatch>
      </form>
    `)
    await vi.waitFor(() => expect(query('reka-slider-thumb').getAttribute('aria-valuenow')).toBe('50'))
    await vi.waitFor(() => expect(query('reka-color-field-input input').getAttribute('data-reka-owned')).not.toBeNull())
    await vi.waitFor(() => expect(query('reka-rating-item-indicator').getAttribute('role')).toBe('radio'))
    expect(await axe(container)).toHaveNoViolations()
    cleanup()
    vi.unstubAllGlobals()
  })
})

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '../..')
const ELEMENTS_DIST = join(PACKAGE_DIR, 'dist/elements.js')
// Like `subpaths.test.ts`: skipped locally without a build, required on CI.
const hasDist = existsSync(ELEMENTS_DIST) || !!process.env.CI

describe.skipIf(!hasDist)('built `reka-ui/elements` entry (dist)', () => {
  afterEach(cleanup)

  it('is the `./elements` export and exposes the source API', async () => {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'))
    expect(pkg.exports['./elements'].import).toBe('./dist/elements.js')
    expect(existsSync(join(PACKAGE_DIR, 'dist/elements.d.ts'))).toBe(true)
    // Types-only subpaths, augmenting global / React types on request.
    for (const name of ['global', 'react']) {
      const types = pkg.exports[`./elements/${name}`].types
      expect(types).toBe(`./dist/elements/${name}.d.ts`)
      expect(readFileSync(join(PACKAGE_DIR, types), 'utf8')).toContain(`from '../elements.js'`)
    }

    const built = await import(/* @vite-ignore */ pathToFileURL(ELEMENTS_DIST).href)
    expect(Object.keys(built).sort()).toEqual(Object.keys(source).sort())

    built.defineRekaElements([built.collapsibleElements], { prefix: 'built' })
    // The source is another copy of the library: it recognises the built copy's
    // elements as Reka elements, through the global symbol registry.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    defineRekaElements([source.collapsibleElements], { prefix: 'built' })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    render(`
      <built-collapsible-root>
        <built-collapsible-trigger>Details</built-collapsible-trigger>
        <built-collapsible-content>Body</built-collapsible-content>
      </built-collapsible-root>
    `)
    const trigger = query('built-collapsible-trigger')
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    trigger.click()
    await vi.waitFor(() => expect(query('built-collapsible-content').getAttribute('data-state')).toBe('open'))
  // Importing the whole built entry takes a few seconds under coverage.
  }, 30_000)

  it('loads only the supported families', () => {
    const seen = new Set<string>()
    const walk = (file: string) => {
      if (seen.has(file))
        return
      seen.add(file)
      for (const [, specifier] of readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*"(\.[^"]+)"/g))
        walk(resolve(dirname(file), specifier))
    }
    walk(ELEMENTS_DIST)
    const loaded = Array.from(seen, file => relative(join(PACKAGE_DIR, 'dist'), file).replaceAll('\\', '/'))
    expect(loaded).toContain('elements/host.js')
    expect(loaded.filter(file => /^(?:Select|Combobox|Menu|Tooltip)\//.test(file))).toEqual([])
  })
})
