<script lang="ts">
import type { Side } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { ArrowProps } from '@/shared/component/Arrow.vue'

const OPPOSITE_SIDE: Record<Side, Side> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

export interface PopperArrowProps extends ArrowProps, PrimitiveProps {}
</script>

<script setup lang="ts">
import type { ComponentPublicInstance, CSSProperties } from 'vue'
import { computed, useAttrs } from 'vue'
import { useCspSafePositioning, useForwardExpose } from '@/shared'
import Arrow from '@/shared/component/Arrow.vue'
import { injectPopperContentContext } from './PopperContent.vue'

defineOptions({
  inheritAttrs: false,
})

withDefaults(
  defineProps<PopperArrowProps>(),
  { as: 'svg' },
)

const { forwardRef } = useForwardExpose()
const contentContext = injectPopperContentContext()

const baseSide = computed(() => OPPOSITE_SIDE[contentContext.placedSide.value])

// Withhold the arrow's positioning style during SSR when CSP-safe positioning is on,
// so the server emits no inline `style` attribute the browser would block. See issue #2732.
const { bindStyle } = useCspSafePositioning()

const arrowStyle = computed<CSSProperties>(() => {
  return {
    position: 'absolute',
    left: contentContext.arrowX?.value ? `${contentContext.arrowX?.value}px` : undefined,
    top: contentContext.arrowY?.value ? `${contentContext.arrowY?.value}px` : undefined,
    [baseSide.value]: 0,
    transformOrigin: {
      top: '',
      right: '0 0',
      bottom: 'center 0',
      left: '100% 0',
    }[contentContext.placedSide.value],
    transform: {
      top: 'translateY(100%)',
      right: 'translateY(50%) rotate(90deg) translateX(-50%)',
      bottom: `rotate(180deg)`,
      left: 'translateY(50%) rotate(-90deg) translateX(50%)',
    }[contentContext.placedSide.value],
    visibility: contentContext.shouldHideArrow.value ? 'hidden' : undefined,
  }
})

const attrs = useAttrs()
const arrowProps = computed(() => bindStyle({}, arrowStyle.value))
// merge the inner svg style with fallthrough attrs so a single `v-bind` carries both
const mergedArrowInnerProps = computed(() => bindStyle(attrs, { display: 'block' }))
</script>

<template>
  <span
    :ref="(el: Element | ComponentPublicInstance | null) => {
      contentContext.onArrowChange((el as HTMLElement) ?? undefined)
      return undefined
    }"
    v-bind="arrowProps"
  >
    <Arrow
      :ref="forwardRef"
      v-bind="mergedArrowInnerProps"
      :as="as"
      :as-child="asChild"
      :rounded="rounded"
      :width="width"
      :height="height"
    >
      <slot />
    </Arrow>
  </span>
</template>
