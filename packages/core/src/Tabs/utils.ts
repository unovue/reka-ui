export type TabValue = string | number | boolean

export function makeTriggerId(baseId: string, value: TabValue) {
  return `${baseId}-trigger-${value}`
}

export function makeContentId(baseId: string, value: TabValue) {
  return `${baseId}-content-${value}`
}
