import { describe, expect, it } from 'vitest'
import Fixture from './fixtures/ReferencedIds.vue'
import MenuFixture from './fixtures/ReferencedIdsMenu.vue'
import { exposed, mount, until } from './utils'

// Mirrors src/shared/useReferencedId.test.ts: the referring part follows a consumer id on the part it references.
function find(testId: string) {
  const element = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  expect(element, testId).toBeTruthy()
  return element!
}

function attr(testId: string, name: string) {
  return find(testId).getAttribute(name)
}

describe('referenced ids (Vapor)', () => {
  it('points aria-labelledby and aria-describedby at consumer ids on DialogTitle and DialogDescription', async () => {
    await mount(Fixture)
    expect(find('title').id).toBe('my-title')
    expect(find('description').id).toBe('my-description')
    expect(attr('dialog', 'aria-labelledby')).toBe('my-title')
    expect(attr('dialog', 'aria-describedby')).toBe('my-description')
  })

  it('follows a consumer id that changes, and drops one that becomes empty', async () => {
    await mount(Fixture)
    const state = exposed<{ titleId: string, descriptionId: string }>()
    state.titleId = 'next-title'
    await until(() => expect(attr('dialog', 'aria-labelledby')).toBe('next-title'))
    expect(find('title').id).toBe('next-title')
    state.descriptionId = ''
    // v3 names the parts after the root's id, and puts the generated id back on the element.
    await until(() => expect(attr('dialog', 'aria-describedby')).toMatch(/^reka-dialog-v-\d+-description$/))
    expect(find('description').id).toBe(attr('dialog', 'aria-describedby'))
  })

  it('renders each title\'s own id, references the first and hands over when it unmounts', async () => {
    await mount(Fixture)
    expect(document.getElementById('first-id')).toBeTruthy()
    expect(document.getElementById('second-id')).toBeTruthy()
    expect(attr('dialog-2', 'aria-labelledby')).toBe('first-id')
    expect(find('plain-title').id).toMatch(/^reka-dialog-v-\d+-title$/)
    exposed<{ showFirst: boolean }>().showFirst = false
    await until(() => expect(attr('dialog-2', 'aria-labelledby')).toBe('second-id'))
    expect(find('plain-title').id).toMatch(/^reka-dialog-v-\d+-title$/)
  })

  it('follows the id on an asChild title\'s child element', async () => {
    await mount(Fixture)
    await until(() => expect(attr('dialog-3', 'aria-labelledby')).toBe('child-title'))
    exposed<{ childId: string }>().childId = 'next-child'
    await until(() => expect(attr('dialog-3', 'aria-labelledby')).toBe('next-child'))
    expect(attr('listbox-group', 'aria-labelledby')).toBe('child-label')
  })

  it('updates a referring part rendered before the part with the consumer id', async () => {
    await mount(Fixture)
    await until(() => expect(attr('select-group', 'aria-labelledby')).toBe('my-group-label'))
    expect(attr('select-item', 'aria-labelledby')).toBe('my-item-text')
    expect(attr('step-trigger', 'aria-labelledby')).toContain('step-title')
  })
  it('follows a consumer id on a trigger that changes after mount', async () => {
    await mount(Fixture)
    // PopoverContent loads its modal / non-modal part asynchronously, so it is not in the DOM right after mount
    await until(() => expect(attr('popover-content', 'aria-labelledby')).toBe('my-trigger'))
    exposed<{ triggerId: string }>().triggerId = 'next-trigger'
    await until(() => expect(find('popover-trigger').id).toBe('next-trigger'))
    await until(() => expect(attr('popover-content', 'aria-labelledby')).toBe('next-trigger'))
  })

  it('follows a consumer id on a content that changes after mount', async () => {
    await mount(Fixture)
    // The trigger points at the content, which loads asynchronously (see above)
    await until(() => expect(attr('popover-trigger', 'aria-controls')).toBe('my-content'))
    expect(attr('tab', 'aria-controls')).toBe('my-panel')
    exposed<{ contentId: string }>().contentId = 'next-content'
    exposed<{ panelId: string }>().panelId = 'next-panel'
    await until(() => expect(find('popover-content').id).toBe('next-content'))
    await until(() => expect(attr('popover-trigger', 'aria-controls')).toBe('next-content'))
    await until(() => expect(find('panel').id).toBe('next-panel'))
    await until(() => expect(attr('tab', 'aria-controls')).toBe('next-panel'))
  })

  // DropdownMenu and Menubar keep their ids on the context (useTriggerId / useContentId), not in a part id
  it('follows a consumer id on a menu trigger and content that changes after mount', async () => {
    await mount(MenuFixture)
    await until(() => expect(attr('dd-content', 'aria-labelledby')).toBe('dd-trigger'))
    expect(attr('dd-trigger', 'aria-controls')).toBe('dd-content')
    await until(() => expect(attr('mb-content', 'aria-labelledby')).toBe('mb-trigger'))
    const state = exposed<{ triggerId: string, contentId: string, mbTriggerId: string }>()
    state.triggerId = 'dd-next-trigger'
    state.contentId = 'dd-next-content'
    state.mbTriggerId = 'mb-next-trigger'
    await until(() => expect(find('dd-trigger').id).toBe('dd-next-trigger'))
    await until(() => expect(attr('dd-content', 'aria-labelledby')).toBe('dd-next-trigger'))
    await until(() => expect(find('dd-content').id).toBe('dd-next-content'))
    await until(() => expect(attr('dd-trigger', 'aria-controls')).toBe('dd-next-content'))
    await until(() => expect(find('mb-trigger').id).toBe('mb-next-trigger'))
    await until(() => expect(attr('mb-content', 'aria-labelledby')).toBe('mb-next-trigger'))
  })
})
