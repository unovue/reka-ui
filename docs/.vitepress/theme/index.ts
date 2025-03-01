import EmbedIframe from '../components/EmbedIframe.vue'
import ComponentPreview from '../components/ComponentPreview.vue'
import InstallationTabs from '../components/InstallationTabs.vue'
import './style.css'
import type { Theme } from 'vitepress'
import { createI18n } from 'vue-i18n'
import messages from '@intlify/unplugin-vue-i18n/messages'

import Layout from '../custom/Layout.vue'

const regex = /\/(\w+)\.vue/
const baseModules = import.meta.glob('../../components/*.vue', { eager: true })
const tableModules = import.meta.glob('../../components/tables/*.vue', { eager: true })
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages,
})

export default {
  // extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.use(i18n)
    for (const path in baseModules)
      app.component(path.match(regex)?.[1] ?? '', (baseModules[path] as any)?.default)

    for (const path in tableModules)
      app.component(path.match(regex)?.[1] ?? '', (tableModules[path] as any)?.default)

    app.component('EmbedIframe', EmbedIframe)
    app.component('ComponentPreview', ComponentPreview)
    app.component('InstallationTabs', InstallationTabs)
  },
} satisfies Theme
