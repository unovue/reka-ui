/**
 * Whether a collection item is disabled: it has a `data-disabled` attribute,
 * whatever its value (a consumer's `data-disabled="true"` counts too). The
 * one rule every collection consumer filters with, the same as the
 * `:not([data-disabled])` selectors.
 *
 * @internal
 */
export function isDisabledItem(element: Element): boolean {
  return element.hasAttribute('data-disabled')
}
