import type { SplitWrapperAttrs, WrapperSpec } from '@/shared/splitWrapperAttrs'
import { isClient } from '@vueuse/shared'
import { computed, nextTick, reactive, ref, shallowRef, watch, watchEffect } from 'vue'
import { containsComposed, getActiveElement, getEventTarget, getOwnerDocument, getRootNode } from '@/shared'
import { createWrapperEmit } from '@/shared/splitWrapperAttrs'
import { createFocusScopesStack } from './stack'
import {
  AUTOFOCUS_ON_MOUNT,
  AUTOFOCUS_ON_UNMOUNT,
  EVENT_OPTIONS,
  focus,
  focusFirst,
  getTabbableCandidates,
  getTabbableEdges,
} from './utils'

export interface UseFocusScopeOptions {
  /** The scope's container: the part's own element. */
  element: { readonly value: HTMLElement | undefined | null }
  /** `FocusScope`'s `loop`. @defaultValue `false` */
  loop?: () => boolean | undefined
  /** `FocusScope`'s `trapped`. @defaultValue `false` */
  trapped?: () => boolean | undefined
  /** `FocusScope`'s `present`. @defaultValue `true` */
  present?: () => boolean | undefined
  /** The `mountAutoFocus` event: called when auto-focusing on mount; can be prevented. */
  onMountAutoFocus?: (event: Event) => void
  /** The `unmountAutoFocus` event: called when auto-focusing on unmount; can be prevented. */
  onUnmountAutoFocus?: (event: Event) => void
}

/**
 * A `FocusScope`, as a composable: traps and loops focus in the part's own
 * element and auto-focuses it on mount and unmount. A part that wrapped its
 * element in `<FocusScope as-child>` binds `attrs()` on it instead.
 *
 * @internal
 * @lifecycle setup
 */
export function useFocusScope(options: UseFocusScopeOptions) {
  const loop = () => !!options.loop?.()
  // A computed, because a part's getter reads what its wrapper received, an
  // object rebuilt on any attr change. The trap's effect follows this value only:
  // re-running it discards its observer's pending records.
  const isTrapped = computed(() => !!options.trapped?.())
  const trapped = () => isTrapped.value
  const isPresent = computed(() => options.present?.() ?? true)
  const present = () => isPresent.value
  // The scope sees its element once the render's post-flush effects run, as
  // `FocusScope` did through its template ref. The mount auto-focus and the
  // stack entry then settle before what the part's own `onMounted` and
  // `nextTick` callbacks do (a Combobox focusing its input inside a Dialog
  // must find the Dialog's trap already paused).
  const element = shallowRef<HTMLElement | null | undefined>()
  watch(() => options.element.value, (value) => {
    element.value = value
  }, { flush: 'post', immediate: true })

  const lastFocusedElementRef = ref<HTMLElement | null>(null)
  const focusScopesStack = createFocusScopesStack()

  const focusScope = reactive({
    paused: false,
    pause() {
      this.paused = true
    },
    resume() {
      this.paused = false
    },
  })

  watchEffect((cleanupFn) => {
    if (!isClient)
      return
    const container = element.value
    if (!trapped())
      return

    // Attach the trap listeners to the container's own root (the ShadowRoot inside
    // a web component, or the Document in light DOM) so focus targets aren't
    // retargeted to the shadow host. In light DOM `root === ownerDocument`, so this
    // is byte-for-byte the previous behavior.
    const root = getRootNode(container)
    const ownerDocument = getOwnerDocument(container)

    // Focus back to the last element focused inside, or to the container when
    // that element is no longer in it (an as-child part re-rendered its element,
    // e.g. a keyed child, under the open scope).
    function recall() {
      const last = lastFocusedElementRef.value
      focus(last && container && !containsComposed(container, last) ? container : last, { select: true })
    }

    function handleFocusIn(event: FocusEvent) {
      if (focusScope.paused || !container)
        return
      const target = event.target as HTMLElement | null
      if (containsComposed(container, target))
        lastFocusedElementRef.value = target
      else recall()
    }

    function handleFocusOut(event: FocusEvent) {
      if (focusScope.paused || !container)
        return
      const relatedTarget = event.relatedTarget as HTMLElement | null

      // A `focusout` event with a `null` `relatedTarget` will happen in at least two cases:
      //
      // 1. When the user switches app/tabs/windows/the browser itself loses focus.
      // 2. In Google Chrome, when the focused element is removed from the DOM.
      //
      // We let the browser do its thing here because:
      //
      // 1. The browser already keeps a memory of what's focused for when the page gets refocused.
      // 2. In Google Chrome, if we try to focus the deleted focused element (as per below), it
      //    throws the CPU to 100%, so we avoid doing anything for this reason here too.
      if (relatedTarget === null)
        return

      // If the focus has moved to an actual legitimate element (`relatedTarget !== null`)
      // that is outside the container, we move focus to the last valid focused element inside.
      if (!containsComposed(container, relatedTarget))
        recall()
    }

    // When the focused element gets removed from the DOM, browsers move focus
    // back to the document.body. In this case, we move focus to the container
    // to keep focus trapped correctly.
    // -- related: https://github.com/unovue/reka-ui/issues/518
    // Reka UI tentative solution:
    // instead of leaning on document.activeElement, we use lastFocusedElementRef.value to check
    // if the element still exist inside the container,
    // if not then we focus to the container
    function handleMutations(mutations: MutationRecord[]) {
      const lastFocusedElement = lastFocusedElementRef.value

      // Mutation may be triggered by something unrelated to focus, e.g. class is set on an element
      // so we first check if we even have a previously focused element. (The
      // observer only runs with a container.)
      if (lastFocusedElement === null || !container) {
        return
      }

      // Ensure mutations removed nodes from the DOM at all.
      const anyNodesRemoved = mutations.some(m => m.removedNodes.length > 0)
      if (!anyNodesRemoved) {
        return
      }

      // Confirm focus was actually orphaned before pulling it back. `lastFocusedElement`
      // is only tracked while the scope is not paused, so an open popper (which pauses
      // this trap and only resumes it in a `setTimeout`) leaves it pointing at a stale
      // element. Without this check, an element focused inside the container during that
      // window — e.g. a view swapped in by the popper's `select` handler focusing its own
      // input on mount — would be robbed of focus.
      // -- related: https://github.com/unovue/reka-ui/issues/2886
      const activeElement = getActiveElement()
      if (activeElement && containsComposed(container, activeElement))
        return

      const isLastFocusedElementExist = containsComposed(container, lastFocusedElement)
      if (!isLastFocusedElementExist)
        focus(container)
    }

    // Second-chance recall. A `focusout` recall loses the race to the pending
    // focus commit, so in light DOM the recall that actually wins is the document
    // `focusin`. A ShadowRoot listener never sees a light-DOM `focusin`, so when
    // `root` is a shadow root we also listen on the owner document and recall via
    // the composed (deep) target.
    function handleDocumentFocusIn(event: FocusEvent) {
      if (focusScope.paused || !container)
        return
      const target = getEventTarget<HTMLElement>(event)
      if (!containsComposed(container, target))
        recall()
    }

    root.addEventListener('focusin', handleFocusIn as EventListener)
    root.addEventListener('focusout', handleFocusOut as EventListener)
    if (root !== ownerDocument)
      ownerDocument.addEventListener('focusin', handleDocumentFocusIn)
    const mutationObserver = new MutationObserver(handleMutations)
    if (container)
      mutationObserver.observe(container, { childList: true, subtree: true })

    cleanupFn(() => {
      root.removeEventListener('focusin', handleFocusIn as EventListener)
      root.removeEventListener('focusout', handleFocusOut as EventListener)
      if (root !== ownerDocument)
        ownerDocument.removeEventListener('focusin', handleDocumentFocusIn)
      mutationObserver.disconnect()
    })
  })

  // Dispatch the mount auto-focus event and move focus to the first tabbable
  // candidate (or the container as a fallback). Shared by the physical-mount path
  // and the visibility path below so both behave identically. Consumers (e.g.
  // Dialog's `openAutoFocus`) may `preventDefault()` to opt out of default focus.
  function dispatchMountAutoFocus(container: HTMLElement, previouslyFocusedElement: HTMLElement | null) {
    const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS)
    const handleMountAutoFocus = (ev: Event) => options.onMountAutoFocus?.(ev)
    container.addEventListener(AUTOFOCUS_ON_MOUNT, handleMountAutoFocus)
    container.dispatchEvent(mountEvent)
    container.removeEventListener(AUTOFOCUS_ON_MOUNT, handleMountAutoFocus)

    if (!mountEvent.defaultPrevented) {
      focusFirst(getTabbableCandidates(container), { select: true })
      if (getActiveElement() === previouslyFocusedElement)
        focus(container)
    }
  }

  watchEffect(async (cleanupFn) => {
    const container = element.value

    await nextTick()
    if (!container)
      return
    // A scope that mounts hidden (`present: false`, e.g. a closed Dialog with
    // `unmountOnHide: false`) must stay out of the scope stack: adding it would
    // pause the currently active scope and break its focus trap. The `present`
    // watcher below adds/removes it as it becomes visible.
    if (present() !== false)
      focusScopesStack.add(focusScope)
    const previouslyFocusedElement = getActiveElement() as HTMLElement | null
    const hasFocusedCandidate = containsComposed(container, previouslyFocusedElement)

    // When force-mounted while closed (e.g. Dialog `unmountOnHide: false`), the
    // consumer keeps the scope mounted but flags it as not present. Skip the
    // mount auto-focus in that case, otherwise it fires `mountAutoFocus` and
    // steals focus into a hidden scope. The `present` watcher below re-runs the
    // auto-focus once the scope becomes present again.
    // NOTE: `present()` must stay read *after* the `await` above so this
    // effect does not track it — re-running on `present` changes would dispatch
    // the unmount auto-focus cleanup below on every close.
    if (!hasFocusedCandidate && present() !== false)
      dispatchMountAutoFocus(container, previouslyFocusedElement)

    cleanupFn(() => {
      const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS)
      const unmountEventHandler = (ev: Event) => {
        options.onUnmountAutoFocus?.(ev)
      }
      container.addEventListener(AUTOFOCUS_ON_UNMOUNT, unmountEventHandler)
      container.dispatchEvent(unmountEvent)

      // Signal that blur events fired below are system-initiated (focus trap
      // cleanup), not user-initiated. Consumers can use this to skip validation.
      container.setAttribute('data-focus-scope-unmounting', '')

      setTimeout(() => {
        if (!unmountEvent.defaultPrevented)
          focus(previouslyFocusedElement ?? getOwnerDocument(container).body, { select: true })

        // we need to remove the listener after we `dispatchEvent`
        container.removeEventListener(AUTOFOCUS_ON_UNMOUNT, unmountEventHandler)

        // Not when the scope moved to another element (its part re-rendered
        // one): it joined the stack again there.
        if (!element.value || element.value === container)
          focusScopesStack.remove(focusScope)
        container.removeAttribute('data-focus-scope-unmounting')
      }, 0)
    })
  })

  // Force-mounted scopes (e.g. Dialog `unmountOnHide: false`) stay mounted across
  // open/close and toggle `present` instead of unmounting, so mount/unmount-keyed
  // behavior must be re-keyed on `present`: stack membership (which pauses other
  // scopes' traps) and the mount auto-focus (which only fires on physical mount).
  // Awaiting `nextTick` lets the consumer's visibility change (e.g. `v-show`)
  // apply first, so the focus targets exist. Consumers that don't pass `present`
  // default it to `true` (see `withDefaults`); since it never changes for them,
  // this watcher never fires and the main effect above owns their stack membership.
  watch(present, async (present, prevPresent) => {
    if (!isClient)
      return

    if (present === false && prevPresent === true) {
      focusScopesStack.remove(focusScope)
      return
    }

    if (present !== true || prevPresent !== false)
      return

    focusScopesStack.add(focusScope)

    await nextTick()
    const container = element.value
    if (!container)
      return

    const previouslyFocusedElement = getActiveElement() as HTMLElement | null
    if (!containsComposed(container, previouslyFocusedElement))
      dispatchMountAutoFocus(container, previouslyFocusedElement)
  })

  function handleKeyDown(event: KeyboardEvent) {
    if (!loop() && !trapped())
      return
    if (focusScope.paused)
      return

    const isTabKey
      = event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey
    const focusedElement = getActiveElement() as HTMLElement | null

    if (isTabKey && focusedElement) {
      const container = event.currentTarget as HTMLElement
      const [first, last] = getTabbableEdges(container)
      const hasTabbableElementsInside = first && last

      // we can only wrap focus if we have tabbable edges
      if (!hasTabbableElementsInside) {
        if (focusedElement === container)
          event.preventDefault()
      }
      else {
        if (!event.shiftKey && focusedElement === last) {
          event.preventDefault()
          if (loop())
            focus(first, { select: true })
        }
        else if (event.shiftKey && focusedElement === first) {
          event.preventDefault()
          if (loop())
            focus(last, { select: true })
        }
      }
    }
  }

  const attrs = { tabindex: '-1', onKeydown: handleKeyDown }
  return {
    /** What `FocusScope` rendered on its element (`tabindex="-1"` and the Tab key handler). */
    attrs: () => attrs,
  }
}

/** `FocusScope`'s props and events, for `splitWrapperAttrs`. @internal */
export const FOCUS_SCOPE_WRAPPER: WrapperSpec = {
  props: { as: false, asChild: true, loop: true, trapped: true, present: true },
  emits: ['mountAutoFocus', 'unmountAutoFocus'],
}

/**
 * `useFocusScope` options from what a `<FocusScope>` wrapper received (its
 * vnode props, split by `splitWrapperAttrs`). @internal
 */
export function focusScopeOptions(element: UseFocusScopeOptions['element'], wrapper: () => SplitWrapperAttrs): UseFocusScopeOptions {
  const emit = createWrapperEmit(wrapper)
  return {
    element,
    loop: () => wrapper().props.loop as boolean | undefined,
    trapped: () => wrapper().props.trapped as boolean | undefined,
    present: () => wrapper().props.present as boolean | undefined,
    onMountAutoFocus: event => emit('onMountAutoFocus', event),
    onUnmountAutoFocus: event => emit('onUnmountAutoFocus', event),
  }
}
