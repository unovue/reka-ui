import { useScrollLock } from './useScrollLock'

export function useBodyScrollLock(initialState?: boolean) {
  return useScrollLock(undefined, initialState)
}
