// Reka UI's date components need Temporal on the server (SSR) and in the browser.
// A universal plugin loads the polyfill in both, keeping a native Temporal when there is one.
import { install } from 'temporal-polyfill-lite/calendars-full/shim'

install(false)

export default defineNuxtPlugin(() => {})
