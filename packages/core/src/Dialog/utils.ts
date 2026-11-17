import type { Ref } from 'vue'
import { onMounted } from 'vue'
import { getActiveElement } from '@/shared'

const DEFAULT_TITLE_NAME = 'DialogTitle'
const DEFAULT_CONTENT_NAME = 'DialogContent'

export type WarningProps = {
  titleName?: string
  contentName?: string
  componentLink?: string
  titleId: string
  descriptionId: string
  contentElement: Ref<HTMLElement | undefined>
}

export function useWarning({
  titleName = DEFAULT_TITLE_NAME,
  contentName = DEFAULT_CONTENT_NAME,
  componentLink = 'dialog.html#title',
  titleId,
  descriptionId,
  contentElement,
}: WarningProps) {
  const TITLE_MESSAGE = `Warning: \`${contentName}\` requires a \`${titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://www.reka-ui.com/docs/components/${componentLink}`

  const DESCRIPTION_MESSAGE = `Warning: Missing \`Description\` or \`aria-describedby="undefined"\` for ${contentName}.`

  onMounted(() => {
    const hasTitle = document.getElementById(titleId)
    if (!hasTitle)
      console.warn(TITLE_MESSAGE)

    const describedById = contentElement.value?.getAttribute('aria-describedby')
    // if we have an id and the user hasn't set aria-describedby="undefined"
    if (descriptionId && describedById) {
      const hasDescription = document.getElementById(descriptionId)
      if (!hasDescription)
        console.warn(DESCRIPTION_MESSAGE)
    }
  })
}

/**
 * The element that had focus when each dialog opened, keyed by its root context.
 */
const focusedBeforeOpen = new WeakMap<object, HTMLElement | null>()
// Roots whose current open came from a `DialogTrigger` press, already recorded.
const pressedToOpen = new WeakSet<object>()

/**
 * Records the pressed `DialogTrigger` as where focus returns. The press may not
 * have focused it: focus can be held in another dialog's trap, or the press is a
 * scripted `click()`. @internal
 */
export function recordTriggerPress(rootContext: object, trigger: HTMLElement) {
  focusedBeforeOpen.set(rootContext, trigger)
  pressedToOpen.add(rootContext)
  // A press the parent did not turn into an open by then leaves no record behind.
  setTimeout(() => pressedToOpen.delete(rootContext))
}

/**
 * Records the element focused as the dialog opens (not `<body>`, not inside the
 * content), unless a trigger press opened it. @internal
 */
export function recordFocusBeforeOpen(rootContext: object, content?: HTMLElement) {
  if (pressedToOpen.delete(rootContext))
    return
  const active = getActiveElement() as HTMLElement | null
  focusedBeforeOpen.set(rootContext, active && active !== active.ownerDocument.body && !content?.contains(active) ? active : null)
}

/** The element focused before the dialog opened, if any. @internal */
export function getFocusedBeforeOpen(rootContext: object) {
  return focusedBeforeOpen.get(rootContext) ?? undefined
}

/**
 * Where focus returns on close: the element focused before the dialog opened,
 * else the trigger, skipping one that has left the DOM. @internal
 */
export function getReturnFocusElement(rootContext: { triggerElement: Ref<HTMLElement | undefined> }) {
  return [getFocusedBeforeOpen(rootContext), rootContext.triggerElement.value].find(element => element?.isConnected)
}
