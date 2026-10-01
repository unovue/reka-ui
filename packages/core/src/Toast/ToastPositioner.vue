<script lang="ts">
import type { ReferenceElement } from '@floating-ui/vue'
import type { ToastObject } from './createToastManager'
import type { PopperContentProps } from '@/Popper'
import { createContext, useForwardExpose } from '@/shared'

export interface ToastPositionerProps extends Omit<PopperContentProps, 'reference' | 'memoDependencies'> {
  /** The toast to position. Its `positionerProps` are used for any prop that is not set. */
  toast: ToastObject
  /** The element to position the toast against. Defaults to `toast.positionerProps.anchor`. */
  anchor?: ReferenceElement | null
}

export const [injectToastPositionerContext, provideToastPositionerContext]
  = createContext<object>('ToastPositioner')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { PopperContent, PopperContentPropsDefaultValue, PopperRoot } from '@/Popper'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastPositionerProps>(), {
  // Leave booleans unset so `toast.positionerProps` can fill them in.
  sideFlip: undefined,
  alignFlip: undefined,
  avoidCollisions: undefined,
  hideShiftedArrow: undefined,
  hideWhenDetached: undefined,
  disableUpdateOnLayoutShift: undefined,
  prioritizePosition: undefined,
})

const { forwardRef } = useForwardExpose()

const DEFAULTS = {
  ...PopperContentPropsDefaultValue,
  side: 'top',
  collisionPadding: 5,
  arrowPadding: 5,
} as const

const resolvedProps = computed(() => {
  const fromToast = props.toast.positionerProps ?? {}
  const resolved: Record<string, unknown> = {}
  for (const key of Object.keys(props) as (keyof ToastPositionerProps)[]) {
    if (key === 'toast' || key === 'anchor')
      continue
    resolved[key] = props[key] ?? fromToast[key as keyof typeof fromToast] ?? DEFAULTS[key as keyof typeof DEFAULTS]
  }
  if (typeof resolved.collisionBoundary === 'function')
    resolved.collisionBoundary = resolved.collisionBoundary()
  return resolved as PopperContentProps
})

const anchor = computed(() => props.anchor ?? props.toast.positionerProps?.anchor ?? undefined)

provideToastPositionerContext({})
</script>

<template>
  <PopperRoot>
    <PopperContent
      v-bind="{ ...resolvedProps, ...$attrs }"
      :ref="forwardRef"
      :reference="anchor"
    >
      <slot />
    </PopperContent>
  </PopperRoot>
</template>
