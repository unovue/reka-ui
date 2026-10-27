import type { ImgHTMLAttributes, Ref } from 'vue'
import { isClient } from '@vueuse/shared'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

function resolveLoadingStatus(image: HTMLImageElement | null, src?: string): ImageLoadingStatus {
  if (!image) {
    return 'idle'
  }
  if (!src) {
    return 'error'
  }
  if (image.src !== src) {
    image.src = src
  }
  return image.complete && image.naturalWidth > 0 ? 'loaded' : 'loading'
}

export function useImageLoadingStatus(src: Ref<string>, { referrerPolicy, crossOrigin }: { referrerPolicy?: Ref<ImgHTMLAttributes['referrerpolicy']>, crossOrigin?: Ref<ImgHTMLAttributes['crossorigin']> } = {}) {
  const isMounted = ref(false)
  const imageRef = ref<HTMLImageElement | null>(null)
  const image = computed(() => {
    if (!isMounted.value) {
      return null
    }
    if (!imageRef.value && isClient) {
      imageRef.value = new window.Image()
    }
    return imageRef.value
  })

  const loadingStatus = ref<ImageLoadingStatus>(resolveLoadingStatus(image.value, src.value))

  const updateStatus = (status: ImageLoadingStatus) => () => {
    if (isMounted.value)
      loadingStatus.value = status
  }

  onMounted(() => {
    isMounted.value = true

    watchEffect((onCleanup) => {
      const img = image.value
      if (!img)
        return

      // Before `src`: the request is made with the policy in force when `src` is set.
      if (referrerPolicy?.value)
        img.referrerPolicy = referrerPolicy.value
      if (typeof crossOrigin?.value === 'string')
        img.crossOrigin = crossOrigin.value

      const handleLoad = updateStatus('loaded')
      const handleError = updateStatus('error')

      img.addEventListener('load', handleLoad)
      img.addEventListener('error', handleError)

      loadingStatus.value = resolveLoadingStatus(img, src.value)

      onCleanup(() => {
        img.removeEventListener('load', handleLoad)
        img.removeEventListener('error', handleError)
      })
    })
  })

  onUnmounted(() => {
    isMounted.value = false
  })

  return loadingStatus
}
