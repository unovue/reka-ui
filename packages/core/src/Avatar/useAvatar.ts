import type { ComputedRef, ImgHTMLAttributes, MaybeRefOrGetter, Ref } from 'vue'
import type { AvatarRootContext } from './AvatarRoot.vue'
import type { ImageLoadingStatus } from './utils'
import type { PartSurface } from '@/shared'
import { isClient } from '@vueuse/shared'
import { computed, ref, toRef, toValue, watch, watchEffect } from 'vue'
import { createPartSurface } from '@/shared'
import { useImageLoadingStatus } from './utils'

export type { ImageLoadingStatus }

export interface UseAvatarReturn {
  /** The loaded status of the avatar's image; `'idle'` until an image reports. */
  imageLoadingStatus: Ref<ImageLoadingStatus>
  context: AvatarRootContext
}

/**
 * Headless Avatar root: the shared image loading status the image and the
 * fallback coordinate through. Pass `context` to `useAvatarImage` and
 * `useAvatarFallback`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useAvatar(): UseAvatarReturn {
  const imageLoadingStatus = ref<ImageLoadingStatus>('idle')
  return { imageLoadingStatus, context: { imageLoadingStatus } }
}

export interface UseAvatarImageProps {
  src: MaybeRefOrGetter<string>
  referrerPolicy?: MaybeRefOrGetter<ImgHTMLAttributes['referrerpolicy']>
  crossOrigin?: MaybeRefOrGetter<ImgHTMLAttributes['crossorigin']>
  /** Called with every loading status, starting with the initial one. */
  onLoadingStatusChange?: (value: ImageLoadingStatus) => void
}

export interface UseAvatarImageReturn {
  loadingStatus: Ref<ImageLoadingStatus>
  /** `true` once the image has loaded; hide the element until then. */
  visible: ComputedRef<boolean>
  root: PartSurface
}

/**
 * Loads the image off-DOM and reports its status to the avatar `context`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — registers mount hooks; call it inside `setup()`.
 */
export function useAvatarImage(context: AvatarRootContext, props: UseAvatarImageProps): UseAvatarImageReturn {
  const src = toRef(props.src)
  const referrerPolicy = toRef(() => toValue(props.referrerPolicy))
  const crossOrigin = toRef(() => toValue(props.crossOrigin))
  const loadingStatus = useImageLoadingStatus(src, { referrerPolicy, crossOrigin })

  watch(
    loadingStatus,
    (value) => {
      props.onLoadingStatusChange?.(value)
      if (value !== 'idle')
        context.imageLoadingStatus.value = value
    },
    { immediate: true },
  )

  return {
    loadingStatus,
    visible: computed(() => loadingStatus.value === 'loaded'),
    root: createPartSurface(() => ({
      role: 'img',
      src: src.value,
      referrerpolicy: referrerPolicy.value,
      crossorigin: crossOrigin.value,
    }), () => ({})),
  }
}

export interface UseAvatarFallbackProps {
  /** Delay before the fallback may render, in ms. Unset or `0` renders it immediately. */
  delayMs?: MaybeRefOrGetter<number | undefined>
}

export interface UseAvatarFallbackReturn {
  /** `true` once the delay has passed and while the image is not loaded. */
  visible: ComputedRef<boolean>
}

/**
 * Fallback visibility: shown after `delayMs` while the image is not loaded.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — starts a timer effect; call it inside `setup()` or an effect scope.
 */
export function useAvatarFallback(context: AvatarRootContext, props: UseAvatarFallbackProps = {}): UseAvatarFallbackReturn {
  // No delay, or `0`, renders straight away.
  const canRender = ref(!toValue(props.delayMs))

  watchEffect((onCleanup) => {
    const delayMs = toValue(props.delayMs)
    if (delayMs && isClient) {
      const timerId = window.setTimeout(() => {
        canRender.value = true
      }, delayMs)

      onCleanup(() => {
        window.clearTimeout(timerId)
      })
    }
  })

  return { visible: computed(() => canRender.value && context.imageLoadingStatus.value !== 'loaded') }
}
