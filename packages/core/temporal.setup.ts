// Reka UI reads the app's global `Temporal` and bundles no polyfill (#2183).
// Tests and stories provide one here, as an app would: Node and some browsers
// have no native Temporal. The "calendars-full" build covers the non-Gregorian
// calendar tests; `install(false)` keeps a native implementation when present.
import { install } from 'temporal-polyfill-lite/calendars-full/shim'

install(false)
