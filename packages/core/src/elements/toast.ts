import type { ComponentObjectPropsOptions } from 'vue'
import type { ToastObject } from '@/Toast'
import { defineComponent, h, watch } from 'vue'
import { injectToastProviderContext, ToastProvider } from '@/Toast'

export type ToastProviderElementEmits = {
  /** The provider's toasts changed (newest first): render a `<reka-toast-root>` for each, with its `toast` property set. */
  'update:toasts': [toasts: ToastObject[]]
}

/** Reports the toasts of the provider around it. */
const ToastsReporter = defineComponent({
  name: 'ToastsReporter',
  emits: ['update:toasts'],
  setup(_, { emit, slots }) {
    const { toastStore } = injectToastProviderContext()
    watch(toastStore.toasts, toasts => emit('update:toasts', toasts))
    return () => slots.default?.()
  },
})

/**
 * `ToastProvider` for `<reka-toast-provider>`. A Vue app lists the toasts with
 * `useToastManager()`, which a page outside Vue cannot call: the element reports
 * them with an `update-toasts` event instead, so the page can render a toast root
 * for each one a `createToastManager()` manager (or the store) holds.
 */
export const ToastProviderElement = defineComponent({
  name: 'ToastProvider',
  inheritAttrs: false,
  props: (ToastProvider as unknown as { props: ComponentObjectPropsOptions }).props,
  emits: ['update:toasts'],
  setup(props, { emit, slots }) {
    return () => h(ToastProvider, props, {
      default: () => h(ToastsReporter, { 'onUpdate:toasts': (toasts: ToastObject[]) => emit('update:toasts', toasts) }, slots),
    })
  },
})
