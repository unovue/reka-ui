import type { CollapsibleContentProps } from './CollapsibleContent.vue'
import { useEventListener } from '@vueuse/core'
import { getCurrentScope, mergeProps, nextTick, onMounted, onUpdated, ref, watch } from 'vue'
import { ENDING_STYLE_ATTR, getRunningAnimations, STARTING_STYLE_ATTR, supportsAnimations, usePresenceState } from '@/Presence/usePresence'
import { getGeneratedId, setGeneratedIds, useForwardElement, useId, usePartId } from '@/shared'
import { onNextFrame } from '@/shared/timeout'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'
import { getCollapsibleContentHidden, getCollapsibleContentSurface } from './useCollapsible'

// Browsers restart a CSS animation whenever its element is inserted into the document again,
// e.g. when a keyed list moves the Collapsible. Once the open/close animation has finished,
// block it again (as on the initial mount) so it only replays on the next toggle, which
// restores the original style. Deferred so Presence still reads the finished animation's
// name in its own `animationend` handler, and skipped while another CSS animation is
// running or paused (a running one retries on its own `animationend`). Transitions are not
// restarted by a move, so they are ignored. Module-level, so it costs nothing per instance.
function blockReplayedAnimation(ev: AnimationEvent) {
  const node = ev.currentTarget as HTMLElement
  if (ev.target !== node)
    return
  // A toggle before the frame starts its own animation; leave that one alone.
  const state = node.getAttribute('data-state')
  requestAnimationFrame(() => {
    if (node.getAttribute('data-state') === state && !node.getAnimations?.().some(animation => 'animationName' in animation && animation.playState !== 'finished'))
      node.style.animationName = 'none'
  })
}

const HEIGHT_VAR = '--reka-collapsible-content-height'
const WIDTH_VAR = '--reka-collapsible-content-width'

/**
 * Everything `CollapsibleContent` does for its element: presence, measuring, the
 * size variables, the generated id and find-in-page. `CollapsibleContent` and
 * `AccordionContent` both render their element with it, so an Accordion item's
 * content is one component, not a `CollapsibleContent` inside an `AccordionContent`.
 *
 * @internal
 * @lifecycle setup
 */
export function useCollapsibleContent(props: CollapsibleContentProps, emitContentFound: (event: Event) => void) {
  const rootContext = injectCollapsibleRootContext()
  // The first content allocates the generated id (the Root leaves the slot empty
  // to keep the v2 allocation order for SSR) and records it, so a later content
  // never takes another content's custom id for its fallback.
  if (!getGeneratedId(rootContext, 'contentId')) {
    const generatedId = rootContext.contentId || useId(undefined, 'reka-collapsible-content')
    setGeneratedIds(rootContext, { contentId: generatedId })
    rootContext.contentId ||= generatedId
  }
  // Rendered on the element; mirrored into the context for the trigger's `aria-controls`.
  const contentId = usePartId(() => props.id, rootContext, 'contentId')

  const { forwardRef, currentElement, expose } = useForwardElement()

  const width = ref(0)
  const height = ref(0)
  const surface = getCollapsibleContentSurface(rootContext, {
    // `hidden` is bound by `attrs()` from the presence state.
    present: true,
    width,
    height,
  })

  // when opening we want it to immediately open to retrieve dimensions
  // when closing we delay `present` to retrieve dimensions before closing
  // Plain variables: they are only read and written by the measuring watcher below, after its
  // `await`, where nothing tracks them.
  let isMountAnimationPrevented = rootContext.open.value
  let currentStyle: Record<string, string> | undefined
  // A panel mounted closed is hidden, so measuring it would only force a layout for a size the
  // animations never read: the next run, once it is shown, measures it before it animates.
  let hasBeenPresent = false
  // Whether a run has seen the panel open, present or force-mounted. Until then it has had no
  // size transition to keep, so the runs skip `getAnimations()` (it brings the page's styles up
  // to date): a closed panel no longer asks for it on mount.
  let hasBeenShown = false

  /**
   * A size transition is still running: the toggle interrupted an open or a
   * close. Measuring would snap the panel to its full size, so keep it where it
   * is and let the transition retarget from there; only the size variables are
   * refreshed from `scrollHeight` / `scrollWidth`.
   */
  function isTransitionRunning(node: HTMLElement) {
    return supportsAnimations(node)
      && getRunningAnimations(node).some(animation => 'transitionProperty' in animation)
  }

  // Created below, after this watcher, so that it runs after it.
  let presence: ReturnType<typeof usePresenceState> | undefined

  watch(
    () => [rootContext.open.value, presence?.isPresent()],
    async () => {
      // This `nextTick` is queued before the presence exit check (this watcher is
      // registered before the presence watcher, so it runs first): the measuring
      // below restores the transitions and the ending style before the exit check
      // asks `getAnimations()` what to wait for. Accordion item switching relies on it
      // (Base UI #3099).
      await nextTick()
      const node = currentElement.value
      if (!node)
        return

      if (props.forceMount || rootContext.open.value || presence?.isPresent())
        hasBeenShown = true
      if (hasBeenShown && isTransitionRunning(node)) {
        height.value = node.scrollHeight
        width.value = node.scrollWidth
        node.style.setProperty(HEIGHT_VAR, `${node.scrollHeight}px`)
        node.style.setProperty(WIDTH_VAR, `${node.scrollWidth}px`)
        return
      }
      // Taken on mount, before `blockReplayedAnimation` can write `none` over the author's inline
      // style (a closed-state animation can end before the first open). Reading it forces no layout.
      currentStyle = currentStyle || {
        transitionDuration: node.style.transitionDuration,
        animationName: node.style.animationName,
      }
      // A force-mounted panel is shown while closed, so it is measured like an open one.
      if (!hasBeenPresent && !props.forceMount && !presence?.isPresent())
        return
      hasBeenPresent = true
      // block any animations/transitions so the element renders at its full dimensions
      node.style.transitionDuration = '0s'
      node.style.animationName = 'none'

      // Measure the natural size (#2827): a transition-based panel sizes itself
      // from the CSS variables (`height: var(--reka-collapsible-content-height)`)
      // and collapses through `data-starting-style` / `data-ending-style`, so
      // neither may apply while measuring.
      const lifecycleAttributes = [STARTING_STYLE_ATTR, ENDING_STYLE_ATTR].filter(name => node.hasAttribute(name))
      lifecycleAttributes.forEach(name => node.removeAttribute(name))
      node.style.setProperty(HEIGHT_VAR, 'auto')
      node.style.setProperty(WIDTH_VAR, 'auto')

      // get width and height from full dimensions
      const rect = node.getBoundingClientRect()
      height.value = rect.height
      width.value = rect.width

      node.style.setProperty(HEIGHT_VAR, `${rect.height}px`)
      node.style.setProperty(WIDTH_VAR, `${rect.width}px`)
      if (lifecycleAttributes.length) {
        // Settle the styles once more with transitions still off, so the
        // transition does not start from the `auto` size used for measuring
        // (which cannot be interpolated): an open settles on its starting style
        // (the transition runs from it once Presence removes the attribute), a
        // close on the measured size (the transition runs from it to the ending
        // style restored below).
        const closing = lifecycleAttributes.includes(ENDING_STYLE_ATTR)
        if (!closing)
          lifecycleAttributes.forEach(name => node.setAttribute(name, ''))
        void getComputedStyle(node).height
        if (closing)
          lifecycleAttributes.forEach(name => node.setAttribute(name, ''))
      }

      // kick off any animations/transitions that were originally set up if it isn't the initial mount
      if (!isMountAnimationPrevented) {
        node.style.transitionDuration = currentStyle.transitionDuration
        node.style.animationName = currentStyle.animationName
      }
    },
    {
      immediate: true,
    },
  )

  // What `<Presence force-mount>` around the element did, without its component instance.
  presence = usePresenceState(() => rootContext.open.value, currentElement, {
    onComplete: value => rootContext.notifyOpenComplete?.(value),
  })

  function onBeforeMatch(ev: Event) {
    requestAnimationFrame(() => {
      if (rootContext.onContentFound)
        rootContext.onContentFound(ev)
      else
        rootContext.onOpenToggle(ev)
      emitContentFound(ev)
    })
  }

  // `beforematch` (find-in-page) is bound as a prop on the tag this part renders. An element it does
  // not render itself (`asChild`, `as="template"`, a component as `as`) may belong to a component that
  // takes the listener for itself or does not pass it on, so that element is listened on directly,
  // from the first render of such an element on.
  let rendersForeignElement = false
  let listensOnElement = false
  const scope = getCurrentScope()
  function beforeMatchProp() {
    const { as, asChild } = props
    rendersForeignElement = !!asChild || as === 'template' || (as != null && typeof as !== 'string')
    return rendersForeignElement ? undefined : onBeforeMatch
  }
  function listenOnForeignElement() {
    if (!rendersForeignElement || listensOnElement)
      return
    listensOnElement = true
    scope?.run(() => useEventListener(currentElement, 'beforematch', (ev: Event) => {
      if (rendersForeignElement)
        onBeforeMatch(ev)
    }))
  }

  onMounted(() => {
    listenOnForeignElement()
    onNextFrame(() => {
      isMountAnimationPrevented = false
    })
  })
  onUpdated(listenOnForeignElement)

  return {
    rootContext,
    forwardRef,
    expose,
    /** The element's props, over the attrs `CollapsibleContent` would have received. */
    attrs: (attrs: Record<string, unknown>) => mergeProps(attrs, surface.attrs.value, {
      id: contentId.value,
      // `forceMount` keeps the content shown; the presence state still tracks the open
      // state so `update:openComplete` is reported either way.
      hidden: getCollapsibleContentHidden(props.forceMount || presence!.isPresent(), rootContext.unmountOnHide.value),
      onAnimationend: blockReplayedAnimation,
      onBeforematch: beforeMatchProp(),
    }, presence!.statusAttrs()),
    /** Whether the default slot renders. */
    showsSlot: () => rootContext.unmountOnHide.value ? props.forceMount || presence!.isPresent() : true,
  }
}
