import type { MaybeRefOrGetter, Ref } from 'vue'
import { onMounted, toValue } from 'vue'
import { getElementByIdFrom } from '@/shared'

const DEFAULT_TITLE_NAME = 'DialogTitle'
const DEFAULT_CONTENT_NAME = 'DialogContent'

export type WarningProps = {
  titleName?: string
  contentName?: string
  componentLink?: string
  titleId: MaybeRefOrGetter<string>
  descriptionId: MaybeRefOrGetter<string>
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
    const hasTitle = getElementByIdFrom(contentElement.value, toValue(titleId))
    if (!hasTitle)
      console.warn(TITLE_MESSAGE)

    const describedById = contentElement.value?.getAttribute('aria-describedby')
    // if we have an id and the user hasn't set aria-describedby="undefined"
    if (toValue(descriptionId) && describedById) {
      const hasDescription = getElementByIdFrom(contentElement.value, toValue(descriptionId))
      if (!hasDescription)
        console.warn(DESCRIPTION_MESSAGE)
    }
  })
}
