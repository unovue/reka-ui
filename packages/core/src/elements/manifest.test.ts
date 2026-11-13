import type { ElementsManifest, ManifestElement } from '../../scripts/elements-manifest'
import type { RekaElement } from './RekaElement'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { defineRekaElements, rekaElementFamilies, toEventType } from '.'
import { createElementsManifest, MANIFEST_FILE, readDocs } from '../../scripts/elements-manifest'
import { hyphenate } from './host'
import { getPartMeta, toPartDefinition } from './meta'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIST_MANIFEST = join(PACKAGE_DIR, 'dist', MANIFEST_FILE)
const DOCS_CONTENT = join(PACKAGE_DIR, '../../docs/content')
// Like the other dist tests: skipped locally without a build, required on CI.
const hasDist = existsSync(DIST_MANIFEST) || !!process.env.CI

interface ElementSummary {
  attributes: string[]
  events: string[]
  properties: string[]
}

/** What the live registry defines: every registered tag, with its observed attributes, events and properties. */
let registry: Map<string, ElementSummary>

beforeAll(() => {
  registry = new Map(defineRekaElements(rekaElementFamilies).map((tag) => {
    // The part the element was defined with (`hidden` and `inert`, which it also
    // observes, are not props).
    const { meta } = (customElements.get(tag) as unknown as typeof RekaElement).rekaPart
    return [tag, {
      attributes: [...meta.observedAttributes].sort(),
      events: [...meta.emits.map(toEventType), 'slot-props-change'].sort(),
      properties: [...meta.properties].sort(),
    }]
  }))
})

function elementsOf(manifest: ElementsManifest): ManifestElement[] {
  return manifest.modules.flatMap(module => module.declarations).filter((declaration): declaration is ManifestElement => 'tagName' in declaration)
}

function summarize(manifest: ElementsManifest): Map<string, ElementSummary> {
  return new Map(elementsOf(manifest).map(element => [element.tagName, {
    attributes: element.attributes.map(attribute => attribute.name).sort(),
    events: element.events.map(event => event.name).sort(),
    // The element's own props: not the inherited `slotProps` / `form`.
    properties: element.members.filter(member => !member.inheritedFrom).map(member => member.name).sort(),
  }]))
}

function expectToMatchRegistry(manifest: ElementsManifest) {
  const summary = summarize(manifest)
  // The tags first, for a readable failure when a family or part is missing.
  expect([...summary.keys()].sort()).toEqual([...registry.keys()].sort())
  for (const [tag, expected] of registry)
    expect({ tag, ...summary.get(tag) }).toEqual({ tag, ...expected })
}

describe('custom elements manifest', () => {
  it('is generated from the registry: every tag, attribute, property and event', () => {
    const manifest = createElementsManifest({
      families: rekaElementFamilies,
      getPartMeta,
      toPartDefinition,
      hyphenate,
      toEventType,
      docs: readDocs(DOCS_CONTENT),
    })
    expect(registry.size).toBeGreaterThan(300)
    expectToMatchRegistry(manifest)

    // Types and descriptions come from the docs.
    const dialogRoot = elementsOf(manifest).find(element => element.tagName === 'reka-dialog-root')!
    expect(dialogRoot.description).toContain('Contains all the parts of a dialog')
    expect(dialogRoot.attributes.find(attribute => attribute.name === 'modal')).toMatchObject({ fieldName: 'modal', type: { text: 'boolean' } })
    expect(dialogRoot.events.find(event => event.name === 'before-update-open')).toMatchObject({
      type: { text: 'RekaElementEvent<boolean, ChangeEventDetails<DialogOpenChangeReason, Event>>' },
      description: expect.stringContaining('Cancelable'),
    })
    const sliderRoot = elementsOf(manifest).find(element => element.tagName === 'reka-slider-root')!
    expect(sliderRoot.attributes.find(attribute => attribute.name === 'orientation')).toMatchObject({ type: { text: '\'horizontal\' | \'vertical\'' }, default: 'horizontal' })
    expect(sliderRoot.members.find(member => member.name === 'modelValue')?.type?.text).toContain('number[]')
  })

  describe.skipIf(!hasDist)('dist/custom-elements.json', () => {
    it('is the package\'s `customElements` manifest, exported and published', () => {
      const pkg = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'))
      expect(pkg.customElements).toBe(`dist/${MANIFEST_FILE}`)
      expect(pkg.exports[`./${MANIFEST_FILE}`]).toBe(`./dist/${MANIFEST_FILE}`)
      expect(pkg.files).toContain('dist')
    })

    it('lists every registered element, with its attributes, properties and events (rebuild if it fails)', () => {
      const manifest: ElementsManifest = JSON.parse(readFileSync(DIST_MANIFEST, 'utf8'))
      expect(manifest.schemaVersion).toMatch(/^2\./)
      expectToMatchRegistry(manifest)
    })
  })
})
