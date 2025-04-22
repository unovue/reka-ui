import type { ImgHTMLAttributes, Ref } from 'vue'
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'

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
    if (!imageRef.value) {
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
    watch(
      [() => image.value, () => src.value],
      ([image, src]) => {
        loadingStatus.value = resolveLoadingStatus(image, src)
      },
      { immediate: true },
    )
  })

  onMounted(() => {
    isMounted.value = true

    watchEffect((onCleanup) => {
      if (!image.value)
        return

      const handleLoad = updateStatus('loaded')
      const handleError = updateStatus('error')

      image.value.addEventListener('load', handleLoad)
      image.value.addEventListener('error', handleError)

      if (referrerPolicy?.value)
        image.value.referrerPolicy = referrerPolicy.value
      if (typeof crossOrigin?.value === 'string')
        image.value.crossOrigin = crossOrigin.value

      onCleanup(() => {
        image.value?.removeEventListener('load', handleLoad)
        image.value?.removeEventListener('error', handleError)
      })
    })
  })

  onUnmounted(() => {
    isMounted.value = false
  })

  return loadingStatus
}
