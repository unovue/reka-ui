export function queryCheckedElement(container: HTMLElement): HTMLElement | null {
  return container?.querySelector('[data-state="checked"]') as HTMLElement | null
}
