// DOM helpers shared by the family table and the in-page driver.
// Events are dispatched in the page, so timings don't include Playwright's IPC round trip.
import { nextTick } from 'vue'

export const $ = (sel, root = document) => root.querySelector(sel)
// The originals: the driver's own queries must not show up in the querySelectorAll counter (main.js).
// (Node imports this module too, for the family table: there is no DOM there.)
const queryAll = typeof Element === 'undefined' ? {} : { el: Element.prototype.querySelectorAll, doc: Document.prototype.querySelectorAll }
export const $$ = (sel, root = document) => [...(root === document ? queryAll.doc : queryAll.el).call(root, sel)]

export const raf = () => new Promise(r => requestAnimationFrame(() => r()))
export async function doubleRaf() {
  await raf()
  await raf()
}
// A macrotask that is neither a timer (nested timers are clamped to 4 ms) nor a frame.
export function task() {
  return new Promise((r) => {
    const c = new MessageChannel()
    c.port1.onmessage = () => r()
    c.port2.postMessage(0)
  })
}
// Style + layout, synchronously: what the browser would do before the next paint.
export const layout = () => document.body.offsetHeight

// Resolves as soon as `cond()` holds: checked after Vue's flush, then after every macrotask.
export async function until(cond, what, timeout = 20000) {
  await nextTick()
  const start = performance.now()
  while (!cond()) {
    if (performance.now() - start > timeout)
      throw new Error(`timeout waiting for: ${what}`)
    await task()
  }
}

export function press(el) {
  const r = el.getBoundingClientRect()
  const base = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, button: 0, view: window }
  const ptr = { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true }
  el.dispatchEvent(new PointerEvent('pointerdown', { ...ptr, buttons: 1 }))
  el.dispatchEvent(new MouseEvent('mousedown', { ...base, buttons: 1 }))
  el.dispatchEvent(new PointerEvent('pointerup', { ...ptr, buttons: 0 }))
  el.dispatchEvent(new MouseEvent('mouseup', { ...base, buttons: 0 }))
  el.dispatchEvent(new MouseEvent('click', { ...base, buttons: 0, detail: 1 }))
}
export function key(el, k) {
  const o = { key: k, code: k.length === 1 ? `Key${k.toUpperCase()}` : k, bubbles: true, cancelable: true, composed: true }
  el.dispatchEvent(new KeyboardEvent('keydown', o))
  el.dispatchEvent(new KeyboardEvent('keyup', o))
}
export function hover(el, type) {
  const r = el.getBoundingClientRect()
  el.dispatchEvent(new PointerEvent(type, { bubbles: type !== 'pointerleave' && type !== 'pointerenter', cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: r.x + 2, clientY: r.y + 2 }))
}
export function contextmenu(el) {
  const r = el.getBoundingClientRect()
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 2, buttons: 2, clientX: r.x + 2, clientY: r.y + 2 }))
  el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, composed: true, button: 2, clientX: r.x + 2, clientY: r.y + 2 }))
}
export function typeInto(input, text) {
  input.focus()
  input.value = text
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }))
}
export function focusKey(el, k) {
  el.focus()
  key(el, k)
}
export const active = () => document.activeElement ?? document.body
export const escape = () => key(active(), 'Escape')
