import { useScrollLock } from './useScrollLock'

/**
 * Lock scrolling of the document body. Equivalent to `useScrollLock()` with no
 * target.
 *
 * @param initialState Whether the lock starts engaged.
 * @returns A writable `boolean` ref controlling this lock.
 */
export function useBodyScrollLock(initialState?: boolean) {
  return useScrollLock(undefined, initialState)
}
