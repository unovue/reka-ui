import { defineConfig, postcssIsolateStyles } from 'vitepress'
import autoprefixer from 'autoprefixer'
import anchor from 'markdown-it-anchor'
import tailwind from 'tailwindcss'
import {
  discord,
  font,
  github,
  ogImage,
  ogUrl,
  rekaDescription,
  rekaName,
  rekaShortName,
} from '../meta'
import { teamMembers } from '../contributors'
import ComponentPreviewPlugin from '../plugins/ComponentPreview'
import InstallationTabsPlugin from '../plugins/InstallationTabs'
import { createHoverTransformer } from '../plugins/HoverTransformer'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import en from './en'
import zh from './zh'

export function BadgeHTML(text: string, translucent = false) {
  return `<div class="inline-flex items-center rounded-full border border-muted px-2 py-[1px] ml-2 text-[11px] transition-colors bg-primary/30 ${translucent ? '!bg-transparent' : ''} text-foreground">
${text}
</div>
`
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  cleanUrls: true,
  title: rekaName,
  description: rekaDescription,
  titleTemplate: rekaShortName,
  head: [
    ['meta', { name: 'theme-color', content: '#00C38A' }],
    ['link', { rel: 'icon', href: '/logo.png' }],
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: `${teamMembers.map(c => c.name).join(', ')} and ${rekaName} contributors` }],
    ['meta', { name: 'keywords', content: 'vue, nuxt, component-library, radix, radix-vue, reka-ui, typescript' }],
    ['meta', { property: 'og:title', content: rekaName }],
    ['meta', { property: 'og:description', content: rekaDescription }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:title', content: rekaName }],
    ['meta', { name: 'twitter:description', content: rekaDescription }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'link',
      {
        rel: 'preload',
        as: 'style',
        onload: 'this.onload=null;this.rel=\'stylesheet\'',
        href: font,
      },
    ],
    [
      'noscript',
      {},
      `<link rel="stylesheet" crossorigin="anonymous" href="${font}" />`,
    ],
    ['link', { rel: 'mask-icon', href: '/logo.svg', color: '#ffffff' }],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
    ],
  ],
  lastUpdated: true,
  sitemap: { hostname: ogUrl },
  themeConfig: {

    outline: {
      level: [2, 3],
    },
    logo: '/logo.svg',

    socialLinks: [
      { icon: 'discord', link: discord },
      { icon: 'github', link: github },
    ],

    search: {
      provider: 'local',
    },
    carbonAds: {
      code: 'CW7DP2JW',
      placement: 'reka-uicom',
    },
  },
  srcDir: 'content',
  appearance: 'dark',
  markdown: {
    theme: 'github-dark',
    headers: {
      level: [2, 3],
    },
    anchor: {
      callback(token) {
        // set tw `group` modifier to heading element
        token.attrSet(
          'class',
          'group relative border-none mb-4 lg:-ml-2 lg:pl-2 lg:pr-2 w-max',
        )
      },
      permalink: anchor.permalink.linkInsideHeader({
        class:
          'header-anchor [&_span]:focus:opacity-100 [&_span_>_span]:focus:outline',
        symbol: `<span class="absolute top-0 -ml-8 hidden items-center border-0 opacity-0 group-hover:opacity-100 focus:opacity-100 lg:flex">&ZeroWidthSpace;<span class="flex h-6 w-6 items-center justify-center rounded-md outline-2 outline-primary text-green-400 shadow-sm  hover:text-green-700 hover:shadow dark:bg-primary/20 dark:text-primary/80 dark:shadow-none  dark:hover:bg-primary/40 dark:hover:text-primary"><svg width="12" height="12" fill="none" aria-hidden="true"><path d="M3.75 1v10M8.25 1v10M1 3.75h10M1 8.25h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg></span></span>`,
        renderAttrs: (slug, state) => {
          // From: https://github.com/vuejs/vitepress/blob/256d742b733bfb62d54c78168b0e867b8eb829c9/src/node/markdown/markdown.ts#L263
          // Find `heading_open` with the id identical to slug
          const idx = state.tokens.findIndex((token) => {
            const attrs = token.attrs
            const id = attrs?.find(attr => attr[0] === 'id')
            return id && slug === id[1]
          })
          // Get the actual heading content
          const title = state.tokens[idx + 1].content
          return {
            'aria-label': `Permalink to "${title}"`,
          }
        },
      }),
    },

    preConfig(md) {
      md.use(ComponentPreviewPlugin)
      md.use(InstallationTabsPlugin)
    },
    codeTransformers: [createHoverTransformer()],
  },
  transformPageData(pageData) {
    if (pageData.frontmatter.sidebar != null)
      return
    // hide sidebar on showcase page
    pageData.frontmatter.sidebar = pageData.frontmatter.layout !== 'showcase'
  },
  vite: {
    css: {
      postcss: {
        plugins: [
          tailwind(),
          autoprefixer(),
          postcssIsolateStyles({ includeFiles: [/vp-doc\.css/] }),
        ],
      },
    },
    plugins: [
      VueI18nPlugin({
        // locale messages resource pre-compile option
        include: resolve(dirname(fileURLToPath(import.meta.url)), '../../locales/**'),
        ssr: true,
      }),
    ],
  },
  rewrites: {
    'en/:rest*': ':rest*',
  },
  locales: {
    root: { label: 'English', ...en },
    zh: { label: '简体中文', ...zh },
  },
})
