import { defaultTriggers } from './list'

export function getTriggerOffset(
  element: HTMLTextAreaElement,
  triggers = defaultTriggers,
) {
  const { value, selectionStart } = element
  for (let i = selectionStart; i >= 0; i--) {
    const char = value[i]
    if (char && triggers.includes(char)) {
      return i
    }
  }
  return -1
}

export function getTrigger(
  element: HTMLTextAreaElement,
  triggers = defaultTriggers,
) {
  const { value, selectionStart } = element
  const previousChar = value[selectionStart - 1]
  if (!previousChar)
    return null
  const secondPreviousChar = value[selectionStart - 2]
  const isIsolated = !secondPreviousChar || /\s/.test(secondPreviousChar)
  if (!isIsolated)
    return null
  if (triggers.includes(previousChar))
    return previousChar
  return null
}

export function getSearchValue(
  element: HTMLTextAreaElement,
  triggers = defaultTriggers,
) {
  const offset = getTriggerOffset(element, triggers)
  if (offset === -1)
    return ''
  return element.value.slice(offset + 1, element.selectionStart)
}

export function getAnchorRect(
  element: HTMLTextAreaElement,
  triggers = defaultTriggers,
) {
  const offset = getTriggerOffset(element, triggers)
  const { left, top, height } = getCaretCoordinates(element, offset + 1)
  const { x, y } = element.getBoundingClientRect()
  return {
    x: left + x - element.scrollLeft,
    y: top + y - element.scrollTop,
    height,
  }
}

export function replaceValue(
  prevValue: string,
  offset: number,
  searchValue: string,
  displayValue: string,
) {
  const nextValue = `${
    prevValue.slice(0, offset) + displayValue
  } ${prevValue.slice(offset + searchValue.length + 1)}`
  return nextValue
}

// reference: https://github.com/component/textarea-caret-position/blob/master/index.js
interface CaretCoordinates {
  top: number
  left: number
  height: number
}

interface CaretOptions {
  debug?: boolean
}

const properties: (keyof CSSStyleDeclaration)[] = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
]

const isBrowser = typeof window !== 'undefined'
const isFirefox = isBrowser && window.navigator.userAgent.toLowerCase().includes('firefox')

function getCaretCoordinates(element: HTMLInputElement | HTMLTextAreaElement, position: number, options?: CaretOptions): CaretCoordinates {
  if (!isBrowser) {
    throw new Error('textarea-caret-position#getCaretCoordinates should only be called in a browser')
  }

  const debug = options?.debug ?? false
  const isInput = element.nodeName === 'INPUT'

  const div = document.createElement('div')
  div.id = 'input-textarea-caret-position-mirror-div'
  document.body.appendChild(div)

  const style = div.style
  const computed = window.getComputedStyle(element)

  style.whiteSpace = 'pre-wrap'
  if (!isInput)
    style.wordWrap = 'break-word'
  style.position = 'absolute'
  if (!debug)
    style.visibility = 'hidden'

  properties.forEach((prop) => {
    if (isInput && prop === 'lineHeight') {
      handleInputLineHeight(style, computed)
    }
    else {
      style[prop] = computed[prop]
    }
  })

  if (isFirefox) {
    if (element.scrollHeight > parseInt(computed.height)) {
      style.overflowY = 'scroll'
    }
  }
  else {
    style.overflow = 'hidden'
  }

  div.textContent = element.value.substring(0, position)
  if (isInput)
    div.textContent = div.textContent.replace(/\s/g, '\u00A0')

  const span = document.createElement('span')
  span.textContent = element.value.substring(position) || '.'
  div.appendChild(span)

  const coordinates: CaretCoordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth),
    height: parseInt(computed.lineHeight),
  }

  if (debug) {
    span.style.backgroundColor = '#aaa'
  }
  else {
    document.body.removeChild(div)
  }

  return coordinates
}

function handleInputLineHeight(style: CSSStyleDeclaration, computed: CSSStyleDeclaration): void {
  if (computed.boxSizing === 'border-box') {
    const height = parseInt(computed.height)
    const outerHeight
      = parseInt(computed.paddingTop)
        + parseInt(computed.paddingBottom)
        + parseInt(computed.borderTopWidth)
        + parseInt(computed.borderBottomWidth)
    const targetHeight = outerHeight + parseInt(computed.lineHeight)
    if (height > targetHeight) {
      style.lineHeight = `${height - outerHeight}px`
    }
    else if (height === targetHeight) {
      style.lineHeight = computed.lineHeight
    }
    else {
      style.lineHeight = '0'
    }
  }
  else {
    style.lineHeight = computed.height
  }
}
