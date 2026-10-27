/*
 * Access to the global `Temporal` (#2183). Internal: not re-exported from
 * `reka-ui/date`.
 *
 * Reka does not bundle a Temporal implementation: it reads the global
 * `Temporal` the app provides (native, or a polyfill the app loads). Every
 * static `Temporal.*` access goes through `getTemporal()`, so a missing global
 * fails with a message that names the fix instead of a bare `TypeError`.
 */

type TemporalNamespace = typeof Temporal

const DOCS = 'https://reka-ui.com/docs/guides/dates'

const MISSING_TEMPORAL_MESSAGE = '[Reka UI] The date components need the Temporal API, but `globalThis.Temporal` is not defined. '
  + 'Load a polyfill before mounting them on runtimes without native Temporal (on the server too when you render there), e.g. '
  + '`import { install } from \'temporal-polyfill-lite/shim\'; install(false)` '
  + `(\`temporal-polyfill-lite/calendars-full/shim\` for non-Gregorian calendars). See ${DOCS}`

/**
 * The global `Temporal` namespace. Throws when the runtime has none (no native
 * support and no polyfill loaded): a descriptive error in development, a
 * one-line one in production.
 *
 * @internal
 */
export function getTemporal(): TemporalNamespace {
  const temporal = (globalThis as { Temporal?: TemporalNamespace }).Temporal
  if (!temporal) {
    // `process.env.NODE_ENV`, not `import.meta.env.DEV`, which is neutered in dist.
    // eslint-disable-next-line node/prefer-global/process
    throw new Error(process.env.NODE_ENV !== 'production' ? MISSING_TEMPORAL_MESSAGE : `[Reka UI] Temporal is not defined: load a polyfill. ${DOCS}`)
  }
  return temporal
}

/**
 * Throws the "Temporal is missing" error. The date composables call it on
 * setup so the failure points at the component, not at the first date
 * computation.
 *
 * @internal
 */
export function assertTemporal() {
  getTemporal()
}
