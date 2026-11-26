// A TypeScript consumer that uses `import`. Type-checked against the packed reka-ui with
// `moduleResolution` "bundler" and "node16" (where a .mts file resolves the `import` condition).
// The package is ESM-only, so there is no CommonJS consumer to check.
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
import nuxtModule from 'reka-ui/nuxt'
import resolver from 'reka-ui/resolver'
import { Primitive } from 'reka-ui/vapor'

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
export const functions = [typed(useForwardPropsEmits), typed(useId), typed(createAgent), typed(createMonth), typed(MenuRoot), typed(nuxtModule), typed(Primitive)]
