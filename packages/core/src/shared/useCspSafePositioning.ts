import { computed, onMounted, ref } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'

/**
 * Resolves the `cspSafePositioning` flag from the nearest `ConfigProvider` and
 * pairs it with a client-mounted signal.
 *
 * When CSP-safe positioning is enabled, floating components should withhold their
 * positioning `:style` until after mount: the server (and the first hydration render)
 * emit no inline `style` attribute — which a strict `style-src` CSP would otherwise
 * block on parse — and the client applies positioning via the (CSP-exempt) CSSOM
 * afterwards. Server and the initial client render agree, so hydration does not mismatch.
 *
 * `shouldApplyPositioningStyle` is therefore `true` in the default (flag off) case and,
 * when the flag is on, only after the component has mounted on the client.
 */
export function useCspSafePositioning() {
  const context = injectConfigProviderContext({
    cspSafePositioning: ref(false),
  })

  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })

  const cspSafePositioning = computed(() => context.cspSafePositioning?.value ?? false)
  const shouldApplyPositioningStyle = computed(
    () => !cspSafePositioning.value || isMounted.value,
  )

  return { cspSafePositioning, isMounted, shouldApplyPositioningStyle }
}
