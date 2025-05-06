import type { ImgHTMLAttributes, Ref } from 'vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

export function useImageLoadingStatus(src: Ref<string>, referrerPolicy?: Ref<ImgHTMLAttributes['referrerpolicy']>) {
  const loadingStatus = ref<ImageLoadingStatus>('idle')
  const isMounted = ref(false)

  const updateStatus = (status: ImageLoadingStatus) => () => {
    if (isMounted.value)
      loadingStatus.value = status
  }

  onMounted(() => {
    isMounted.value = true

    watch([() => src.value, () => referrerPolicy?.value], ([src, referrer]) => {
      if (!src) {
        loadingStatus.value = 'error'
      }
      else {
        const image = new window.Image()
        loadingStatus.value = 'loading'
        image.onload = updateStatus('loaded')
        image.onerror = updateStatus('error')
        image.src = src
        if (referrer) {
          image.referrerPolicy = referrer
        }
      }
    }, { immediate: true })
  })

  onUnmounted(() => {
    isMounted.value = false
  })

  return loadingStatus
}
