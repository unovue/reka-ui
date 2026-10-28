<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface VisuallyHiddenProps extends PrimitiveProps {
  /**
   * How the content is hidden.
   *
   * - `focusable` (default): hidden visually only. The content stays in the
   *   accessibility tree, so slotted text is announced and can label its
   *   parent, and it keeps whatever focusability it has.
   * - `fully-hidden`: also removed from the accessibility tree
   *   (`aria-hidden="true"`) and the tab order (`tabindex="-1"`). Use for
   *   hidden form inputs.
   */
  feature?: 'focusable' | 'fully-hidden'
}
</script>

<script setup lang="ts">
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

withDefaults(defineProps<VisuallyHiddenProps>(), { as: 'span', feature: 'focusable' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAsEmpty(as, asChild)"
    :ref="forwardRef"
    :aria-hidden="feature === 'fully-hidden' ? 'true' : undefined"
    :data-hidden="feature === 'fully-hidden' ? '' : undefined"
    :tabindex="feature === 'fully-hidden' ? '-1' : undefined"
    :style="{
      // See: https://github.com/twbs/bootstrap/blob/a360960b8dfdb4bf48f87539c2243458fa0366f7/scss/mixins/_visually-hidden.scss
      position: 'absolute',
      border: 0,
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
      wordWrap: 'normal',

      // Prevent causing unnecessary container scroll
      // @see https://github.com/unovue/reka-ui/issues/2127
      top: '-1px',
      left: '-1px',
    }"
  >
    <!-- `as="input"` (the hidden form input) renders no children. -->
    <template
      v-if="rendersChildren(as, asChild)"
      #default
    >
      <slot />
    </template>
  </component>
</template>
