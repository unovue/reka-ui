import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { CheckboxGroupRoot } from '@/Checkbox'
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
    expect(parseAttribute('boolean', 'open', '')).toBe(true)
    expect(parseAttribute('boolean', 'open', 'open')).toBe(true)
    expect(parseAttribute('boolean', 'open', 'false')).toBe(false)
    expect(parseAttribute('boolean', 'open', null)).toBeUndefined()
    expect(parseAttribute('booleanish', 'model-value', '')).toBe(true)
    expect(parseAttribute('booleanish', 'model-value', 'indeterminate')).toBe('indeterminate')
    expect(parseAttribute('number', 'side-offset', '8')).toBe(8)
    expect(parseAttribute('number', 'side-offset', 'x')).toBeUndefined()
    expect(parseAttribute('string', 'value', 'a')).toBe('a')
  })

  it('names events in kebab-case, without colons', () => {
    expect(toEventType('update:modelValue')).toBe('update-model-value')
    expect(toEventType('beforeUpdate:open')).toBe('before-update-open')
    expect(toEventType('escapeKeyDown')).toBe('escape-key-down')
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

    const built = await import(/* @vite-ignore */ pathToFileURL(ELEMENTS_DIST).href)
    expect(Object.keys(built).sort()).toEqual(Object.keys(source).sort())

    built.defineRekaElements([built.collapsibleElements], { prefix: 'built' })
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
  })

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
    expect(loaded.filter(file => /^(?:Select|Combobox|Calendar|Menu|Tooltip)\//.test(file))).toEqual([])
  })
})
