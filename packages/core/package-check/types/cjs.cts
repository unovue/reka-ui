// A TypeScript consumer whose output is CommonJS. Type-checked against the packed reka-ui with
// `moduleResolution` "node16" (a .cts file resolves the `require` condition, so the .d.cts files)
// and "node10" (no `exports` support: subpaths come from `typesVersions`).
// `reka-ui/vapor` is left out: it is ESM-only.
/* eslint-disable ts/no-require-imports -- `import x = require()` is how a CommonJS consumer loads the two `export =` entries */
import type { DateValue } from 'reka-ui'
import type { Components } from 'reka-ui/constant'
import type { ModuleOptions } from 'reka-ui/nuxt'
import type { ResolverOptions } from 'reka-ui/resolver'
import type { Component } from 'vue'
import { AccordionRoot, DialogRoot, PopoverContent, useForwardPropsEmits, useId } from 'reka-ui'
import { createAgent } from 'reka-ui/agent'
import { components } from 'reka-ui/constant'
import { createMonth } from 'reka-ui/date'
import { MenuRoot } from 'reka-ui/internal'
import { Accordion, Dialog } from 'reka-ui/namespaced'
import nuxtModule = require('reka-ui/nuxt')
import resolver = require('reka-ui/resolver')

// Fails when an entry resolves to no declarations (everything would be `any`)
type NotAny<T> = 0 extends 1 & T ? never : T
function typed<T>(value: NotAny<T>): T {
  return value
}

export const parts: Component[] = [typed(AccordionRoot), typed(DialogRoot), typed(PopoverContent), typed(Accordion.Root), typed(Dialog.Content)]
export const group: Components['accordion'] = typed(components).accordion
export const options: [Partial<ModuleOptions>, ResolverOptions] = [{ prefix: 'Reka' }, { prefix: 'Reka' }]
export const resolved = typed(resolver)(options[1])
export const date: DateValue | undefined = undefined
export const functions = [typed(useForwardPropsEmits), typed(useId), typed(createAgent), typed(createMonth), typed(MenuRoot), typed(nuxtModule)]
