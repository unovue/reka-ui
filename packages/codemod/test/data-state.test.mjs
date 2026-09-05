import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { transformDataState } from '../src/data-state.mjs'

function code(source) {
  return transformDataState(source).code
}

const PRESENCE_MESSAGE = '"[data-state]" is now always present, so a presence-only selector matches every part; target the explicit value instead'

describe('unconditional renames', () => {
  it('rewrites tailwind variants', () => {
    const source = '<Toggle class="data-[state=on]:bg-green-5 data-[state=off]:bg-gray-3" />'
    const result = transformDataState(source)
    assert.equal(result.code, '<Toggle class="data-[state=checked]:bg-green-5 data-[state=unchecked]:bg-gray-3" />')
    assert.equal(result.changed, true)
    assert.deepEqual(result.warnings, [])
  })

  it('rewrites every mapped value in tailwind variants', () => {
    const source = [
      'data-[state=visible]:opacity-100',
      'data-[state=hidden]:opacity-0',
      'data-[state=expanded]:w-64',
      'data-[state=collapsed]:w-0',
      'data-[state=instant-open]:animate-in',
    ].join(' ')
    assert.equal(code(source), [
      'data-[state=open]:opacity-100',
      'data-[state=closed]:opacity-0',
      'data-[state=open]:w-64',
      'data-[state=closed]:w-0',
      'data-[state=open]:animate-in',
    ].join(' '))
  })

  it('rewrites quoted tailwind variants', () => {
    assert.equal(code(`data-[state='on']:bg-x data-[state="off"]:bg-y`), `data-[state='checked']:bg-x data-[state="unchecked"]:bg-y`)
  })

  it('rewrites group- and peer- prefixed tailwind variants', () => {
    const source = 'group-data-[state=on]:text-white peer-data-[state=hidden]:hidden group-data-[state=expanded]/sidebar:block'
    assert.equal(code(source), 'group-data-[state=checked]:text-white peer-data-[state=closed]:hidden group-data-[state=open]/sidebar:block')
  })

  it('rewrites unquoted css attribute selectors', () => {
    assert.equal(code('.Toggle[data-state=on] { color: red; }'), '.Toggle[data-state=checked] { color: red; }')
  })

  it('rewrites single-quoted css attribute selectors', () => {
    assert.equal(code(`.Toggle[data-state='on'] { color: red; }`), `.Toggle[data-state='checked'] { color: red; }`)
  })

  it('rewrites double-quoted css attribute selectors', () => {
    assert.equal(code(`.Toggle[data-state="on"] { color: red; }`), `.Toggle[data-state="checked"] { color: red; }`)
  })

  it('rewrites every mapped value in css attribute selectors', () => {
    const source = [
      `.ScrollAreaScrollbar[data-state='visible'] {}`,
      `.ScrollAreaScrollbar[data-state='hidden'] {}`,
      `.SplitterPanel[data-state='expanded'] {}`,
      `.SplitterPanel[data-state='collapsed'] {}`,
      `.TooltipContent[data-state='instant-open'] {}`,
    ].join('\n')
    assert.equal(code(source), [
      `.ScrollAreaScrollbar[data-state='open'] {}`,
      `.ScrollAreaScrollbar[data-state='closed'] {}`,
      `.SplitterPanel[data-state='open'] {}`,
      `.SplitterPanel[data-state='closed'] {}`,
      `.TooltipContent[data-state='open'] {}`,
    ].join('\n'))
  })

  it('preserves whitespace around the css equals sign', () => {
    assert.equal(code(`[data-state = "off" ]`), `[data-state = "unchecked" ]`)
  })
})

describe('delayed-open', () => {
  it('splits the tailwind variant into open and delayed', () => {
    assert.equal(
      code('data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in'),
      'data-[state=open]:data-[delayed]:animate-in data-[state=open]:data-[delayed]:fade-in',
    )
  })

  it('keeps the group- and peer- prefix on both variants', () => {
    assert.equal(
      code('group-data-[state=delayed-open]:visible peer-data-[state=delayed-open]:visible'),
      'group-data-[state=open]:group-data-[delayed]:visible peer-data-[state=open]:peer-data-[delayed]:visible',
    )
  })

  it('keeps a named group on both variants', () => {
    assert.equal(code('group-data-[state=delayed-open]/tip:block'), 'group-data-[state=open]/tip:group-data-[delayed]/tip:block')
  })

  it('keeps quoting in the tailwind variant', () => {
    assert.equal(code(`data-[state='delayed-open']:block`), `data-[state='open']:data-[delayed]:block`)
  })

  it('appends [data-delayed] to css selectors and keeps the quoting style', () => {
    assert.equal(code(`.TooltipContent[data-state='delayed-open'][data-side='top'] {}`), `.TooltipContent[data-state='open'][data-delayed][data-side='top'] {}`)
    assert.equal(code(`.TooltipContent[data-state="delayed-open"] {}`), `.TooltipContent[data-state="open"][data-delayed] {}`)
    assert.equal(code('.TooltipContent[data-state=delayed-open] {}'), '.TooltipContent[data-state=open][data-delayed] {}')
  })
})

describe('active / inactive', () => {
  const activeWarning = 'ambiguous data-state "active": rewrite to "checked" for Tabs/TagsInput/Rating, rewrite to "current" for Stepper, keep for SplitterResizeHandle'
  const inactiveWarning = 'ambiguous data-state "inactive": rewrite to "unchecked" for Tabs/TagsInput/Rating, rewrite to "upcoming" for Stepper, keep for SplitterResizeHandle'

  it('rewrites to checked / unchecked when the file only mentions Tabs, TagsInput or Rating', () => {
    const source = [
      '<TabsTrigger class="data-[state=active]:text-grass-11 data-[state=inactive]:text-gray-11" />',
      `.TagsInputItem[data-state='active'] {}`,
      `.RatingItemIndicator[data-state="inactive"] {}`,
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, [
      '<TabsTrigger class="data-[state=checked]:text-grass-11 data-[state=unchecked]:text-gray-11" />',
      `.TagsInputItem[data-state='checked'] {}`,
      `.RatingItemIndicator[data-state="unchecked"] {}`,
    ].join('\n'))
    assert.deepEqual(result.warnings, [])
  })

  it('rewrites to current / upcoming when the file only mentions Stepper', () => {
    const source = [
      '<StepperItem class="group data-[state=active]:font-bold data-[state=inactive]:opacity-50 data-[state=completed]:text-green" />',
      '<StepperTrigger class="group-data-[state=active]:bg-black group-data-[state=inactive]:bg-white" />',
      `.StepperItem[data-state='active'] .StepperIndicator {}`,
      `.StepperSeparator[data-state="inactive"] {}`,
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, [
      '<StepperItem class="group data-[state=current]:font-bold data-[state=upcoming]:opacity-50 data-[state=completed]:text-green" />',
      '<StepperTrigger class="group-data-[state=current]:bg-black group-data-[state=upcoming]:bg-white" />',
      `.StepperItem[data-state='current'] .StepperIndicator {}`,
      `.StepperSeparator[data-state="upcoming"] {}`,
    ].join('\n'))
    assert.equal(result.changed, true)
    assert.deepEqual(result.warnings, [])
  })

  it('keeps active and inactive when the file only mentions SplitterResizeHandle', () => {
    const source = [
      '<SplitterResizeHandle class="data-[state=inactive]:bg-gray-3 data-[state=active]:bg-gray-5" />',
      `.SplitterResizeHandle[data-state='inactive'] {}`,
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, source)
    assert.equal(result.changed, false)
    assert.deepEqual(result.warnings, [])
  })

  it('warns per line when the file mentions more than one group', () => {
    const source = [
      '<TabsTrigger class="data-[state=active]:font-bold" />',
      '<StepperItem class="data-[state=active]:font-bold" />',
      `.Tabs [data-state='inactive'] {}`,
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, source)
    assert.equal(result.changed, false)
    assert.deepEqual(result.warnings, [
      { line: 1, message: activeWarning },
      { line: 2, message: activeWarning },
      { line: 3, message: inactiveWarning },
    ])
  })

  it('warns when the file mentions both Stepper and SplitterResizeHandle', () => {
    const source = [
      '<StepperItem class="data-[state=inactive]:opacity-50" />',
      `.SplitterResizeHandle[data-state='inactive'] {}`,
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, source)
    assert.equal(result.changed, false)
    assert.deepEqual(result.warnings, [
      { line: 1, message: inactiveWarning },
      { line: 2, message: inactiveWarning },
    ])
  })

  it('warns when the file mentions no group', () => {
    const source = `.trigger[data-state="active"] { color: red; }`
    const result = transformDataState(source)
    assert.equal(result.code, source)
    assert.deepEqual(result.warnings, [{ line: 1, message: activeWarning }])
  })

  it('still applies the unconditional renames on ambiguous files', () => {
    const source = '<StepperItem class="data-[state=active]:x" /><TabsTrigger class="data-[state=on]:y" />'
    const result = transformDataState(source)
    assert.equal(result.code, '<StepperItem class="data-[state=active]:x" /><TabsTrigger class="data-[state=checked]:y" />')
    assert.equal(result.warnings.length, 1)
  })
})

describe('presence-only selectors', () => {
  it('leaves a bare [data-state] alone and warns', () => {
    const source = [
      '.RatingItemIndicator[data-state] { opacity: 1; }',
      '.SplitterPanel[ data-state ] { flex: 1; }',
      '.Toggle[data-state=checked] { color: red; }',
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, source)
    assert.equal(result.changed, false)
    assert.deepEqual(result.warnings, [
      { line: 1, message: PRESENCE_MESSAGE },
      { line: 2, message: PRESENCE_MESSAGE },
    ])
  })

  it('leaves :not([data-state]) alone and warns', () => {
    const source = [
      '.RatingItemIndicator:not([data-state]) { opacity: 0.3; }',
      '.SplitterPanel:not( [data-state] ) { flex: 1; }',
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, source)
    assert.equal(result.changed, false)
    assert.deepEqual(result.warnings, [
      { line: 1, message: PRESENCE_MESSAGE },
      { line: 2, message: PRESENCE_MESSAGE },
    ])
  })
})

describe('safety', () => {
  it('does not touch unrelated attributes or plain words', () => {
    const source = [
      '<div class="hidden data-[side=top]:mt-2 data-[orientation=horizontal]:flex-row on off visible" />',
      '[data-orientation=vertical] { display: flex; }',
      '[data-side="top"] { top: 0; }',
      '[data-state=open] { display: block; }',
      '[data-state=checked] { display: block; }',
      'const state = "on"',
      'toggle.on()',
    ].join('\n')
    const result = transformDataState(source)
    assert.equal(result.code, source)
    assert.equal(result.changed, false)
    assert.deepEqual(result.warnings, [])
  })

  it('does not rewrite part of a longer value', () => {
    assert.equal(code('data-[state=on-hover]:x [data-state=offline] {}'), 'data-[state=on-hover]:x [data-state=offline] {}')
  })

  it('is idempotent', () => {
    const source = [
      '<Toggle class="data-[state=on]:bg-x group-data-[state=delayed-open]:block" />',
      `.TabsTrigger[data-state='active'] {}`,
      `.TooltipContent[data-state="delayed-open"] {}`,
      '.RatingItemIndicator:not([data-state]) {}',
    ].join('\n')
    const first = transformDataState(source)
    assert.equal(first.changed, true)
    const second = transformDataState(first.code)
    assert.equal(second.code, first.code)
    assert.equal(second.changed, false)
    assert.deepEqual(second.warnings, first.warnings)
  })

  it('reports changed: false and preserves the source when nothing matches', () => {
    const result = transformDataState('body { margin: 0 }')
    assert.equal(result.code, 'body { margin: 0 }')
    assert.equal(result.changed, false)
  })
})
