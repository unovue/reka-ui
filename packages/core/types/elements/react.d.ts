// `reka-ui/elements/react` (types only): JSX typings for the default-prefixed
// tags in React 19, with camelCase props and `onupdate-model-value`-style event
// props.
//
//   /// <reference types="reka-ui/elements/react" />
//
// Copied to `dist/elements/` by `scripts/postbuild.ts`.
import type { HTMLAttributes, RefAttributes } from 'react'
import type { RekaIntrinsicElements } from '../elements.js'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends RekaIntrinsicElements<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>> {}
  }
}
