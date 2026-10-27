import type { Theme } from 'vitepress'
import { install as installTemporal } from 'temporal-polyfill-lite/calendars-full/shim'
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue'
import ComponentPreview from '../components/ComponentPreview.vue'
import EmbedIframe from '../components/EmbedIframe.vue'
import InstallationTabs from '../components/InstallationTabs.vue'

import Layout from '../custom/Layout.vue'

import './style.css'

// The date demos need Temporal; keep the browser's own when it has one.
installTemporal(false)

const regex = /\/(\w+)\.vue/
const baseModules = import.meta.glob('../../components/*.vue', { eager: true })
const tableModules = import.meta.glob('../../components/tables/*.vue', { eager: true })

export default {
  // extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons)
    for (const path in baseModules)
      app.component(path.match(regex)?.[1] ?? '', (baseModules[path] as any)?.default)

    for (const path in tableModules)
      app.component(path.match(regex)?.[1] ?? '', (tableModules[path] as any)?.default)

    app.component('EmbedIframe', EmbedIframe)
    app.component('ComponentPreview', ComponentPreview)
    app.component('InstallationTabs', InstallationTabs)
  },
} satisfies Theme
