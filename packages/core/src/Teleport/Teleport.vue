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
import type { VNode } from 'vue'
import type { RootNode } from '@/shared'
import { isClient } from '@vueuse/shared'
import { computed, getCurrentInstance, onMounted, ref, shallowRef } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { getRootNode, resolveTeleportTarget } from '@/shared'

const props = defineProps<TeleportProps>()

const configContext = injectConfigProviderContext({})

const instance = getCurrentInstance()

/**
 * Where `node` sits in `tree` (a parent component's render tree, which does
 * not descend into child components): `undefined` if absent, otherwise the
 * innermost native `Teleport` vnode on the way to it, or `null` for none.
 */
function findTeleportAbove(tree: VNode, node: VNode, teleport: VNode | null = null): VNode | null | undefined {
  if (tree === node)
    return teleport
  if ((tree.type as { __isTeleport?: boolean } | undefined)?.__isTeleport)
    teleport = tree
  if (Array.isArray(tree.children)) {
    for (const child of tree.children) {
      if (child && typeof child === 'object') {
        const found = findTeleportAbove(child as VNode, node, teleport)
        if (found !== undefined)
          return found
      }
    }
  }
  return undefined
}

function isTeleportDisabled(teleport: VNode) {
  const disabled = teleport.props?.disabled
  return !!disabled || disabled === ''
}

/**
 * The root this portal is about to render in, before it has a DOM anchor of
 * its own: the root of its existing node when hydrating, or of the nearest
 * ancestor already in the DOM. A native `Teleport` between this portal and
 * that ancestor moves the content elsewhere, so its (already resolved) target
 * decides instead. `undefined` when unknown, e.g. during the app's first
 * client render, where nothing is in the DOM yet.
 */
function getInitialRootNode(): RootNode | undefined {
  if (!isClient || !instance)
    return undefined
  const hydrated = instance.vnode.el as Node | null | undefined
  if (hydrated?.isConnected)
    return getRootNode(hydrated)
  for (let child = instance, parent = instance.parent; parent; child = parent, parent = parent.parent) {
    const teleport = parent.subTree && findTeleportAbove(parent.subTree, child.vnode)
    if (teleport && !isTeleportDisabled(teleport)) {
      // Resolved before its children mount, unless the Teleport is deferred.
      const teleportTarget = teleport.target as Node | null | undefined
      return teleportTarget?.isConnected ? getRootNode(teleportTarget) : undefined
    }
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
const rootNode = shallowRef<RootNode | undefined>()
const isMounted = ref(false)
onMounted(() => {
  rootNode.value = getRootNode(instance?.subTree.el as Node | null | undefined)
  isMounted.value = true
})

// `forceMount` renders the content before this portal mounts: on the server,
// when hydrating, when the portal is created inside an already mounted tree,
// and whenever the root doesn't decide where the content goes (`disabled`, or
// an element target). Otherwise, on the app's first client render, the root is
// unknown, so the content waits for the mount instead of mounting into `body`
// and moving afterwards (root-scoped setup such as focus guards would stay
// behind in the document).
// The same holds without `forceMount` for a portal created by an update of an
// already mounted client app, e.g. a family portal that rendered nothing while
// closed and opens now: the content renders in this flush, so post-flush code
// (`watch(open, …, { flush: 'post' })`, `onUpdated`) sees it on the first open
// as on every later one. A portal on the app's first render, while hydrating
// (its vnode already has a node; the server rendered no content) or on the
// server waits for the mount, so the initial root (an ancestor walk that grows
// with the number of sibling portals) is never looked up for it.
let canRenderBeforeMount = false
if (props.forceMount || (isClient && !!instance?.root.isMounted && !instance.vnode.el)) {
  const initialRootNode = getInitialRootNode()
  rootNode.value = initialRootNode
  const explicitTo = props.to ?? configContext.teleportTo?.value
  // Vue resolves a deferred selector against the document. In a shadow root this
  // component looks it up instead (`resolveTeleportTarget`), so, like `defer`,
  // it waits until the rest of the tree is in the DOM.
  const resolvesDeferredSelectorInShadowRoot = !!props.defer
    && typeof explicitTo === 'string'
    && (initialRootNode as ShadowRoot | undefined)?.host !== undefined
  canRenderBeforeMount = !isClient
    || props.disabled
    || (!!explicitTo && typeof explicitTo !== 'string')
    || (!!initialRootNode && !resolvesDeferredSelectorInShadowRoot)
}

// Vue's `Teleport` mounts into any parent node (it only calls `insertBefore`), so
// a `ShadowRoot` target is fine; its prop type just doesn't name it. Read
// again once mounted: a selector can match an element that mounted since.
const target = computed(() => {
  void isMounted.value
  return resolveTeleportTarget(props.to ?? configContext.teleportTo?.value, rootNode.value) as string | HTMLElement
})
</script>

<template>
  <Teleport
    v-if="isMounted || canRenderBeforeMount"
    :to="target"
    :disabled="disabled"
    :defer="defer"
  >
    <slot />
  </Teleport>
</template>
