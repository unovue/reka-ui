import type { Theme } from 'vitepress'
import ComponentPreview from '../components/ComponentPreview.vue'
import EmbedIframe from '../components/EmbedIframe.vue'
import InstallationTabs from '../components/InstallationTabs.vue'
import Layout from '../custom/Layout.vue'

import './style.css'

const regex = /\/(\w+)\.vue/
const baseModules = import.meta.glob('../../components/*.vue', { eager: true })
const tableModules = import.meta.glob('../../components/tables/*.vue', { eager: true })

export default {
  // extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    for (const path in baseModules)
      app.component(path.match(regex)?.[1] ?? '', (baseModules[path] as any)?.default)

    for (const path in tableModules)
      app.component(path.match(regex)?.[1] ?? '', (tableModules[path] as any)?.default)

    app.component('EmbedIframe', EmbedIframe)
    app.component('ComponentPreview', ComponentPreview)
    app.component('InstallationTabs', InstallationTabs)
  },
} satisfies Theme
