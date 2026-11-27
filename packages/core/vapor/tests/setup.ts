import { afterEach, expect } from 'vitest'
import { unmountAll, warnings } from './utils'

afterEach(() => {
  const logged = [...warnings]
  unmountAll()
  // A Vue warning in a native Vapor app usually means a VDOM-only path ran (or attrs got lost)
  expect(logged).toEqual([])
})
