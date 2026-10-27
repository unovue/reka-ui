// `reka-ui/elements/global` (types only): types the default-prefixed tags in
// `HTMLElementTagNameMap`, so `document.querySelector('reka-switch-root')` and
// `document.createElement()` return the element's type.
//
//   /// <reference types="reka-ui/elements/global" />
//
// Copied to `dist/elements/` by `scripts/postbuild.ts`.
import type { RekaElementTagNameMap } from '../elements.js'

declare global {
  interface HTMLElementTagNameMap extends RekaElementTagNameMap {}
}
