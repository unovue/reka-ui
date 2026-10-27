<script lang="ts">
export interface TeleportProps {
  /**
   * Vue native teleport component prop `:to`. Defaults to `ConfigProvider`'s
   * `teleportTo`, then to `body`, or to the shadow root the portal is rendered in.
   *
   * {@link https://vuejs.org/guide/built-ins/teleport.html#basic-usage}
   */
  to?: string | HTMLElement
  /**
   * Disable teleport and render the component inline
   *
   * {@link https://vuejs.org/guide/built-ins/teleport.html#disabling-teleport}
   */
  disabled?: boolean
  /**
   * Defer the resolving of a Teleport target until other parts of the
   * application have mounted (requires Vue 3.5.0+)
   *
   * {@link https://vuejs.org/guide/built-ins/teleport.html#deferred-teleport}
   */
  defer?: boolean
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import type { RootNode } from '@/shared'
import { isClient } from '@vueuse/shared'
import { computed, getCurrentInstance, onMounted, ref, shallowRef } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { getRootNode, resolveTeleportTarget } from '@/shared'

const props = defineProps<TeleportProps>()

const configContext = injectConfigProviderContext({})

const instance = getCurrentInstance()

/**
 * The root this portal is about to render in, before it has a DOM anchor of
 * its own: the root of its existing node when hydrating, or of the nearest
 * ancestor already in the DOM. `undefined` during the app's first client
 * render, where nothing is in the DOM yet (the tree is inserted once built).
 */
function getInitialRootNode(): RootNode | undefined {
  if (!isClient || !instance)
    return undefined
  const hydrated = instance.vnode.el as Node | null | undefined
  if (hydrated?.isConnected)
    return getRootNode(hydrated)
  for (let parent = instance.parent; parent; parent = parent.parent) {
    const el = parent.subTree?.el as Node | null | undefined
    if (parent.isMounted && el?.isConnected)
      return getRootNode(el)
  }
  return undefined
}

// The root node (document or shadow root) this portal is rendered in, so a
// portal inside a shadow root keeps its content in that shadow root instead of
// escaping to `document.body`. Confirmed on mount from the component's own DOM
// anchor (the `v-if` placeholder, or the Teleport's start anchor).
const initialRootNode = getInitialRootNode()
const rootNode = shallowRef<RootNode | undefined>(initialRootNode)
const isMounted = ref(false)
onMounted(() => {
  rootNode.value = getRootNode(instance?.subTree.el as Node | null | undefined)
  isMounted.value = true
})

// `forceMount` renders the content before this portal mounts: on the server,
// when hydrating, and when the portal is created inside an already mounted
// tree. On the app's first client render the root is unknown, so the content
// waits for the mount instead of mounting into `body` and moving afterwards
// (root-scoped setup such as focus guards would stay behind in the document).
const canRenderBeforeMount = !isClient || !!initialRootNode

// Vue's `Teleport` mounts into any parent node (it only calls `insertBefore`), so
// a `ShadowRoot` target is fine; its prop type just doesn't name it.
const target = computed(() => resolveTeleportTarget(props.to ?? configContext.teleportTo?.value, rootNode.value) as string | HTMLElement)
</script>

<template>
  <Teleport
    v-if="isMounted || (forceMount && canRenderBeforeMount)"
    :to="target"
    :disabled="disabled"
    :defer="defer"
  >
    <slot />
  </Teleport>
</template>
