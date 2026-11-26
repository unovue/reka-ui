import type { DialogRootContext } from './DialogRoot.vue'
import { onBeforeUnmount, shallowRef, watch } from 'vue'

/**
 * Nested dialogs: each open dialog reports to the dialog it is nested in, which
 * adds up its nested dialogs and passes the total on, so a dialog knows how
 * many dialogs are open on top of it (`data-nested-dialog-open`,
 * `--nested-dialogs` on its content).
 *
 * @param context The root's own context; gets `nestedOpenDialogCount` and `onNestedOpenChange`.
 * @param parentContext The context of the dialog this one is nested in, if any.
 */
export function useNestedDialogs(context: DialogRootContext, parentContext: DialogRootContext | null) {
  const nestedOpenDialogCount = shallowRef(0)
  let nestedOpenCounts: Map<symbol, number> | undefined
  context.nestedOpenDialogCount = nestedOpenDialogCount
  context.onNestedOpenChange = (id, count) => {
    nestedOpenCounts ??= new Map()
    if (count > 0)
      nestedOpenCounts.set(id, count)
    else
      nestedOpenCounts.delete(id)
    let total = 0
    for (const nestedCount of nestedOpenCounts.values())
      total += nestedCount
    nestedOpenDialogCount.value = total
  }

  const report = parentContext?.onNestedOpenChange
  if (!report)
    return
  const nestedId = Symbol('nestedDialog')
  watch(
    [context.open, nestedOpenDialogCount],
    // A closed dialog still passes on the dialogs open below it: one in its root slot,
    // outside its content, can stay open after this one closes.
    ([isOpen, nestedCount]) => report(nestedId, nestedCount + (isOpen ? 1 : 0)),
    { immediate: true },
  )
  onBeforeUnmount(() => report(nestedId, 0))
}
