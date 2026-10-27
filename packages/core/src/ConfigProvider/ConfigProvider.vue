<script lang="ts">
import type { Ref } from 'vue'
import type { Direction, ScrollBodyOption } from '@/shared/types'
import { createContext } from '@/shared'

interface ConfigProviderContextValue {
  dir?: Ref<Direction>
  locale?: Ref<string>
  scrollBody?: Ref<boolean | ScrollBodyOption>
  nonce?: Ref<string | undefined>
  teleportTo?: Ref<string | HTMLElement | undefined>
  useId?: () => string
}

export const [injectConfigProviderContext, provideConfigProviderContext]
  = createContext<ConfigProviderContextValue>('ConfigProvider')

export interface ConfigProviderProps {
  /**
   * The global reading direction of your application. This will be inherited by all primitives.
   * @defaultValue 'ltr'
   */
  dir?: Direction
  /**
   * The global locale of your application. This will be inherited by all primitives.
   * @defaultValue 'en'
   */
  locale?: string
  /**
   * How modal primitives lock page scroll. `true` keeps the layout stable with
   * `scrollbar-gutter: stable` (or by pinning `<body>`'s size where that is
   * unsupported), `false` only hides the overflow, and `{ padding, margin }`
   * hides the overflow and offsets `<body>` by the given amounts (`true` = the
   * scrollbar width). The lock never touches `pointer-events`.
   * @type boolean | ScrollBodyOption
   */
  scrollBody?: boolean | ScrollBodyOption
  /**
   * The global `nonce` value of your application. This will be inherited by the related primitives.
   * @type string
   */
  nonce?: string
  /**
   * The global default teleport target for all portalled primitives (e.g. `Dialog`, `Popover`, `Tooltip`).
   * Individual `*Portal` components can still override this via their own `to` prop.
   * Without it, portals render into `body`, or into the shadow root they are rendered in.
   * Inside a shadow root, a selector is looked up in the shadow root first, then in the document.
   * @type string | HTMLElement
   */
  teleportTo?: string | HTMLElement
  /**
   * The global `useId` injection as a workaround for preventing hydration issue.
   */
  useId?: () => string
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
  nonce: undefined,
  teleportTo: undefined,
  useId: undefined,
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
