<script lang="ts">
import type { Ref } from 'vue'
import type { Direction, ScrollBodyOption } from '@/shared/types'
import { createContext } from '@/shared'

interface ConfigProviderContextValue {
  dir?: Ref<Direction> | undefined
  locale?: Ref<string> | undefined
  scrollBody?: Ref<boolean | ScrollBodyOption> | undefined
  nonce?: Ref<string | undefined> | undefined
  teleportTo?: Ref<string | HTMLElement | undefined> | undefined
  useId?: (() => string) | undefined
}

export const [injectConfigProviderContext, provideConfigProviderContext]
  = createContext<ConfigProviderContextValue>('ConfigProvider')

export interface ConfigProviderProps {
  /**
   * The global reading direction of your application. This will be inherited by all primitives.
   * @defaultValue 'ltr'
   */
  dir?: Direction | undefined
  /**
   * The global locale of your application. This will be inherited by all primitives.
   * @defaultValue 'en'
   */
  locale?: string | undefined
  /**
   * The global scroll body behavior of your application. This will be inherited by the related primitives.
   * @type boolean | ScrollBodyOption
   */
  scrollBody?: boolean | ScrollBodyOption | undefined
  /**
   * The global `nonce` value of your application. This will be inherited by the related primitives.
   * @type string
   */
  nonce?: string | undefined
  /**
   * The global default teleport target for all portalled primitives (e.g. `Dialog`, `Popover`, `Tooltip`).
   * Individual `*Portal` components can still override this via their own `to` prop.
   * Useful when rendering inside a custom element / shadow DOM.
   * @type string | HTMLElement
   */
  teleportTo?: string | HTMLElement | undefined
  /**
   * The global `useId` injection as a workaround for preventing hydration issue.
   */
  useId?: (() => string) | undefined
}
</script>

<script setup lang="ts">
import { toRefs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  dir: 'ltr',
  locale: 'en',
  scrollBody: true,
})

const { dir, locale, scrollBody, nonce, teleportTo } = toRefs(props)

provideConfigProviderContext({
  dir,
  locale,
  scrollBody,
  nonce,
  teleportTo,
  useId: props.useId,
})
</script>

<template>
  <slot />
</template>
