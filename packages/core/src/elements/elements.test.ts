import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { CheckboxGroupRoot } from '@/Checkbox'
import { DialogRoot } from '@/Dialog'
import { FieldError, FieldLabel } from '@/Field'
import { FormRoot } from '@/Form'
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

  it('lets only props that default to `true` take `"false"`, never native attribute names', () => {
    const dialog = getPartMeta({ component: DialogRoot })
    expect(dialog.byAttribute.get('modal')?.defaultTrue).toBe(true)
    expect(dialog.byAttribute.get('open')?.defaultTrue).toBeUndefined()
    expect(getPartMeta({ component: SwitchRoot }).byAttribute.get('disabled')?.defaultTrue).toBeUndefined()
  })

  it('leaves fixed props out of the element API, and gates listened emits', () => {
    const label = getPartMeta({ component: FieldLabel, fixedProps: { nativeLabel: false, for: undefined } })
    expect(label.observedAttributes).not.toContain('native-label')
    expect(label.observedAttributes).not.toContain('for')
    expect(label.properties).not.toContain('nativeLabel')
    expect(label.fixedProps).toEqual({ nativeLabel: false, for: undefined })
    const form = getPartMeta({ component: FormRoot, listenedEmits: ['formSubmit'] })
    expect([...form.listenedEvents]).toEqual(['form-submit'])
    expect(getPartMeta({ component: FieldError, attributes: { match: 'booleanish' } }).byAttribute.get('match')?.kind).toBe('booleanish')
    // `siblings: true` is `'after'`.
    expect(getPartMeta({ component: FormRoot, siblings: true }).siblings).toBe('after')
    expect(getPartMeta({ component: FormRoot, siblings: 'inside' }).siblings).toBe('inside')
    expect(getPartMeta({ component: FormRoot }).siblings).toBe(false)
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

  it('display parts', async () => {
    const container = render(`
      <reka-aspect-ratio ratio="2"><span>Media</span></reka-aspect-ratio>
      <reka-avatar-root><reka-avatar-fallback>CT</reka-avatar-fallback></reka-avatar-root>
      <reka-separator></reka-separator>
      <reka-progress-root model-value="40" aria-label="Upload"><reka-progress-indicator></reka-progress-indicator></reka-progress-root>
      <button><reka-visually-hidden>Save</reka-visually-hidden></button>
    `)
    await mounted('reka-avatar-fallback')
    await mounted('reka-progress-indicator')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('radio and toggle groups, and a toolbar', async () => {
    const container = render(`
      <form>
        <reka-radio-group-root aria-label="Density" name="density" default-value="a">
          <reka-radio-group-item value="a" aria-label="Default"><reka-radio-group-indicator></reka-radio-group-indicator></reka-radio-group-item>
          <reka-radio-group-item value="b" aria-label="Compact"><reka-radio-group-indicator></reka-radio-group-indicator></reka-radio-group-item>
        </reka-radio-group-root>
        <reka-toggle-group-root type="multiple" aria-label="Formatting" name="format">
          <reka-toggle-group-item value="bold" aria-label="Bold">B</reka-toggle-group-item>
          <reka-toggle-group-item value="italic" aria-label="Italic">I</reka-toggle-group-item>
        </reka-toggle-group-root>
      </form>
      <reka-toolbar-root aria-label="Editing">
        <reka-toolbar-toggle-group type="single" aria-label="Alignment">
          <reka-toolbar-toggle-item value="left">Left</reka-toolbar-toggle-item>
        </reka-toolbar-toggle-group>
        <reka-toolbar-separator></reka-toolbar-separator>
        <reka-toolbar-button>Share</reka-toolbar-button>
      </reka-toolbar-root>
    `)
    await mounted('reka-radio-group-indicator')
    await mounted('reka-toolbar-button')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('pagination and stepper', async () => {
    const container = render(`
      <reka-pagination-root total="30" items-per-page="10">
        <reka-pagination-list>
          <reka-pagination-prev>Previous</reka-pagination-prev>
          <reka-pagination-list-item value="1">1</reka-pagination-list-item>
          <reka-pagination-list-item value="2">2</reka-pagination-list-item>
          <reka-pagination-ellipsis>…</reka-pagination-ellipsis>
          <reka-pagination-next>Next</reka-pagination-next>
        </reka-pagination-list>
      </reka-pagination-root>
      <reka-stepper-root default-value="1">
        <reka-stepper-item step="1">
          <reka-stepper-trigger>
            <reka-stepper-indicator>1</reka-stepper-indicator>
            <reka-stepper-title>Address</reka-stepper-title>
          </reka-stepper-trigger>
          <reka-stepper-description>Where to ship</reka-stepper-description>
          <reka-stepper-separator></reka-stepper-separator>
        </reka-stepper-item>
        <reka-stepper-item step="2">
          <reka-stepper-trigger>
            <reka-stepper-indicator>2</reka-stepper-indicator>
            <reka-stepper-title>Payment</reka-stepper-title>
          </reka-stepper-trigger>
        </reka-stepper-item>
      </reka-stepper-root>
    `)
    await mounted('reka-pagination-next')
    await mounted('reka-stepper-separator')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('scroll area and splitter', async () => {
    const container = render(`
      <reka-scroll-area-root type="always" style="height: 100px">
        <reka-scroll-area-viewport><p>Content</p></reka-scroll-area-viewport>
        <reka-scroll-area-scrollbar><reka-scroll-area-thumb></reka-scroll-area-thumb></reka-scroll-area-scrollbar>
      </reka-scroll-area-root>
      <reka-splitter-group direction="horizontal">
        <reka-splitter-panel default-size="50">Left</reka-splitter-panel>
        <reka-splitter-resize-handle aria-label="Resize"></reka-splitter-resize-handle>
        <reka-splitter-panel default-size="50">Right</reka-splitter-panel>
      </reka-splitter-group>
    `)
    await mounted('reka-scroll-area-viewport')
    await mounted('reka-splitter-resize-handle')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a form with a field, in a config provider', async () => {
    const container = render(`
      <reka-config-provider dir="rtl">
        <reka-form-root>
          <form novalidate>
            <reka-field-root name="terms" required>
              <reka-field-label>Accept the terms</reka-field-label>
              <reka-checkbox-root></reka-checkbox-root>
              <reka-field-description>Required to continue.</reka-field-description>
              <reka-field-error match>Accept the terms to continue.</reka-field-error>
            </reka-field-root>
          </form>
        </reka-form-root>
      </reka-config-provider>
    `)
    await mounted('reka-field-error')
    await vi.waitFor(() => expect(query('reka-checkbox-root').getAttribute('aria-labelledby')).toBe(query('reka-field-label').id))
    expect(await axe(container)).toHaveNoViolations()
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

  it('an open alert dialog', async () => {
    render(`
      <reka-alert-dialog-root default-open>
        <reka-alert-dialog-trigger>Delete</reka-alert-dialog-trigger>
        <reka-alert-dialog-portal>
          <reka-alert-dialog-overlay></reka-alert-dialog-overlay>
          <reka-alert-dialog-content>
            <reka-alert-dialog-title>Delete the file?</reka-alert-dialog-title>
            <reka-alert-dialog-description>This cannot be undone.</reka-alert-dialog-description>
            <reka-alert-dialog-cancel>Cancel</reka-alert-dialog-cancel>
            <reka-alert-dialog-action>Delete</reka-alert-dialog-action>
          </reka-alert-dialog-content>
        </reka-alert-dialog-portal>
      </reka-alert-dialog-root>
    `)
    await mounted('reka-alert-dialog-action')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('an open dropdown menu', async () => {
    render(`
      <reka-dropdown-menu-root default-open>
        <reka-dropdown-menu-trigger>Options</reka-dropdown-menu-trigger>
        <reka-dropdown-menu-portal>
          <reka-dropdown-menu-content>
            <reka-dropdown-menu-label>Edit</reka-dropdown-menu-label>
            <reka-dropdown-menu-item>Undo</reka-dropdown-menu-item>
            <reka-dropdown-menu-separator></reka-dropdown-menu-separator>
            <reka-dropdown-menu-checkbox-item>Show hidden</reka-dropdown-menu-checkbox-item>
            <reka-dropdown-menu-radio-group model-value="a">
              <reka-dropdown-menu-radio-item value="a">A</reka-dropdown-menu-radio-item>
            </reka-dropdown-menu-radio-group>
          </reka-dropdown-menu-content>
        </reka-dropdown-menu-portal>
      </reka-dropdown-menu-root>
    `)
    await mounted('reka-dropdown-menu-radio-item')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('a menubar and a navigation menu', async () => {
    const container = render(`
      <reka-menubar-root>
        <reka-menubar-menu value="file">
          <reka-menubar-trigger>File</reka-menubar-trigger>
          <reka-menubar-portal>
            <reka-menubar-content><reka-menubar-item>New</reka-menubar-item></reka-menubar-content>
          </reka-menubar-portal>
        </reka-menubar-menu>
      </reka-menubar-root>
      <reka-navigation-menu-root>
        <reka-navigation-menu-list>
          <reka-navigation-menu-item value="learn">
            <reka-navigation-menu-trigger>Learn</reka-navigation-menu-trigger>
            <reka-navigation-menu-content><a href="#a">A</a></reka-navigation-menu-content>
          </reka-navigation-menu-item>
          <reka-navigation-menu-item>
            <reka-navigation-menu-link href="#github">GitHub</reka-navigation-menu-link>
          </reka-navigation-menu-item>
        </reka-navigation-menu-list>
      </reka-navigation-menu-root>
    `)
    await mounted('reka-menubar-trigger')
    await mounted('reka-navigation-menu-link')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('an open tooltip and hover card', async () => {
    render(`
      <reka-tooltip-provider>
        <reka-tooltip-root default-open>
          <reka-tooltip-trigger>Bold</reka-tooltip-trigger>
          <reka-tooltip-portal><reka-tooltip-content>Make text bold</reka-tooltip-content></reka-tooltip-portal>
        </reka-tooltip-root>
      </reka-tooltip-provider>
      <reka-hover-card-root default-open>
        <reka-hover-card-trigger tabindex="0">Profile</reka-hover-card-trigger>
        <reka-hover-card-portal><reka-hover-card-content>About me</reka-hover-card-content></reka-hover-card-portal>
      </reka-hover-card-root>
    `)
    await mounted('reka-tooltip-content')
    await mounted('reka-hover-card-content')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('a toast', async () => {
    render(`
      <reka-toast-provider>
        <reka-toast-root duration="100000">
          <reka-toast-title>Saved</reka-toast-title>
          <reka-toast-description>Your file was saved.</reka-toast-description>
          <reka-toast-close aria-label="Close">×</reka-toast-close>
        </reka-toast-root>
        <reka-toast-viewport></reka-toast-viewport>
      </reka-toast-provider>
    `)
    await mounted('reka-toast-close')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('listbox', async () => {
    const container = render(`
      <reka-listbox-root default-value="b">
        <reka-listbox-filter><input aria-label="Search"></reka-listbox-filter>
        <reka-listbox-content aria-label="Letters">
          <reka-listbox-group>
            <reka-listbox-group-label>Letters</reka-listbox-group-label>
            <reka-listbox-item value="a">A</reka-listbox-item>
            <reka-listbox-item value="b">B<reka-listbox-item-indicator>✓</reka-listbox-item-indicator></reka-listbox-item>
          </reka-listbox-group>
        </reka-listbox-content>
      </reka-listbox-root>
    `)
    await mounted('reka-listbox-item-indicator')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('an open combobox and autocomplete', async () => {
    render(`
      <reka-combobox-root default-open>
        <reka-combobox-anchor>
          <reka-combobox-input><input aria-label="Fruit"></reka-combobox-input>
          <reka-combobox-trigger aria-label="Show fruits">▾</reka-combobox-trigger>
        </reka-combobox-anchor>
        <reka-combobox-portal>
          <reka-combobox-content>
            <reka-combobox-viewport>
              <reka-combobox-group>
                <reka-combobox-label>Fruits</reka-combobox-label>
                <reka-combobox-item value="apple">Apple</reka-combobox-item>
              </reka-combobox-group>
            </reka-combobox-viewport>
          </reka-combobox-content>
        </reka-combobox-portal>
      </reka-combobox-root>
      <reka-autocomplete-root>
        <reka-autocomplete-input><input aria-label="City"></reka-autocomplete-input>
      </reka-autocomplete-root>
    `)
    await mounted('reka-combobox-item')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('an open select', async () => {
    render(`
      <reka-select-root default-open default-value="a">
        <reka-select-trigger aria-label="Letter"><reka-select-value placeholder="Pick"></reka-select-value></reka-select-trigger>
        <reka-select-portal>
          <reka-select-content position="popper">
            <reka-select-viewport>
              <reka-select-group>
                <reka-select-label>Letters</reka-select-label>
                <reka-select-item value="a"><reka-select-item-text>A</reka-select-item-text></reka-select-item>
              </reka-select-group>
            </reka-select-viewport>
          </reka-select-content>
        </reka-select-portal>
      </reka-select-root>
    `)
    await mounted('reka-select-item')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('tree', async () => {
    const container = render('')
    const root = document.createElement('reka-tree-root') as HTMLElement & { items: unknown[], getKey: (item: { id: string }) => string }
    root.setAttribute('aria-label', 'Files')
    root.items = [{ id: 'a' }, { id: 'b' }]
    root.getKey = item => item.id
    for (const item of root.items) {
      const el = document.createElement('reka-tree-item') as HTMLElement & { value: unknown }
      el.value = item
      el.setAttribute('level', '1')
      el.textContent = (item as { id: string }).id
      root.append(el)
    }
    container.append(root)
    await mounted('reka-tree-item')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('tags input, tag group and editable', async () => {
    const container = render(`
      <reka-tags-input-root>
        <reka-tags-input-item value="vue"><reka-tags-input-item-text></reka-tags-input-item-text><reka-tags-input-item-delete aria-label="Remove">×</reka-tags-input-item-delete></reka-tags-input-item>
        <reka-tags-input-input><input aria-label="Tags"></reka-tags-input-input>
        <reka-tags-input-clear aria-label="Clear">×</reka-tags-input-clear>
      </reka-tags-input-root>
      <reka-tag-group-root aria-label="Frameworks" selection-mode="single">
        <reka-tag-group-item value="vue" text-value="Vue"><span role="gridcell"><reka-tag-group-item-text>Vue</reka-tag-group-item-text><reka-tag-group-item-delete>×</reka-tag-group-item-delete></span></reka-tag-group-item>
      </reka-tag-group-root>
      <reka-editable-root default-value="Title">
        <reka-editable-area>
          <reka-editable-preview></reka-editable-preview>
          <reka-editable-input><input aria-label="Title"></reka-editable-input>
        </reka-editable-area>
        <reka-editable-edit-trigger>Edit</reka-editable-edit-trigger>
      </reka-editable-root>
    `)
    await mounted('reka-tags-input-item-text')
    await mounted('reka-tag-group-item-text')
    await mounted('reka-editable-preview')
    expect(await axe(container)).toHaveNoViolations()
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
    // Importing the built entry loads every family's modules, slow under coverage.
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
    expect(loaded.filter(file => /^(?:Calendar|DatePicker)\//.test(file))).toEqual([])
  })
})
