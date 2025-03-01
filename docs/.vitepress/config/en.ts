import { defineConfig } from 'vitepress'
import { version } from '../../package.json'
import {
  legacyLink,
  legacyVersion,
  rekaDescription,
  rekaName,
  rekaShortName,
  releases,
} from '../meta'
import { BadgeHTML } from '.'

export default defineConfig({
  lang: 'en',
  title: rekaName,
  description: rekaDescription,
  titleTemplate: rekaShortName,
  lastUpdated: true,
  srcDir: 'content/en',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Docs', link: '/docs/overview/getting-started' },
      { text: 'Examples', link: '/examples/checkbox-group' },
      { text: 'Showcase', link: '/showcase' },
      {
        text: `v${version}`,
        items: [
          { text: 'Release Notes ', link: releases },
          { text: legacyVersion, link: legacyLink },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Overview',
        icon: 'lucide:rocket',
        items: [
          { text: 'Introduction', link: '/docs/overview/introduction' },
          { text: 'Getting Started', link: '/docs/overview/getting-started' },
          { text: 'Installation', link: '/docs/overview/installation' },
          { text: 'Accessibility', link: '/docs/overview/accessibility' },
          { text: 'Releases', link: '/docs/overview/releases' },
        ],
      },
      {
        text: 'Guides',
        icon: 'lucide:book-open',
        items: [
          { text: 'Styling', link: '/docs/guides/styling' },
          { text: 'Animation/Transition', link: '/docs/guides/animation' },
          { text: 'Composition', link: '/docs/guides/composition' },
          { text: `Controlled State ${BadgeHTML('New')}`, link: '/docs/guides/controlled-state' },
          {
            text: 'Server side rendering',
            link: '/docs/guides/server-side-rendering',
          },
          { text: 'Namespaced', link: '/docs/guides/namespaced-components' },
          { text: 'Dates', link: '/docs/guides/dates' },
          { text: 'Internationalization (RTL)', link: '/docs/guides/i18n' },
          {
            text: `Inject Context ${BadgeHTML('New')}`,
            link: '/docs/guides/inject-context',
          },
          {
            text: `Virtualization ${BadgeHTML('New')}`,
            link: '/docs/guides/virtualization',
          },
          {
            text: `Migration ${BadgeHTML('New')}`,
            link: '/docs/guides/migration',
          },
        ],
      },
      {
        text: 'Components',
        icon: 'lucide:box',
        items: [
          {
            text: 'Form',
            items: [
              { text: 'Checkbox', link: '/docs/components/checkbox' },
              { text: 'Combobox', link: '/docs/components/combobox' },
              { text: `Editable`, link: '/docs/components/editable' },
              { text: `Listbox`, link: '/docs/components/listbox' },
              { text: `Number Field`, link: '/docs/components/number-field' },
              { text: 'Label', link: '/docs/components/label' },
              { text: 'Pin Input', link: '/docs/components/pin-input' },
              { text: 'Radio Group', link: '/docs/components/radio-group' },
              { text: 'Select', link: '/docs/components/select' },
              { text: 'Slider', link: '/docs/components/slider' },
              { text: 'Switch', link: '/docs/components/switch' },
              { text: 'Tags Input', link: '/docs/components/tags-input' },
              { text: 'Toggle', link: '/docs/components/toggle' },
              { text: 'Toggle Group', link: '/docs/components/toggle-group' },
            ],
          },
          {
            text: 'Dates',
            items: [
              {
                text: `Calendar ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/calendar',
              },
              {
                text: `Date Field ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/date-field',
              },
              {
                text: `Date Picker ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/date-picker',
              },
              {
                text: `Date Range Field ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/date-range-field',
              },
              {
                text: `Date Range Picker ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/date-range-picker',
              },
              {
                text: `Range Calendar ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/range-calendar',
              },
              {
                text: `Time Field ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/time-field',
              },
            ],
          },
          {
            text: 'General',
            items: [
              { text: 'Accordion', link: '/docs/components/accordion' },
              { text: 'Alert Dialog', link: '/docs/components/alert-dialog' },
              { text: 'Aspect Ratio', link: '/docs/components/aspect-ratio' },
              { text: 'Avatar', link: '/docs/components/avatar' },
              { text: 'Collapsible', link: '/docs/components/collapsible' },
              { text: 'Context Menu', link: '/docs/components/context-menu' },
              { text: 'Dialog', link: '/docs/components/dialog' },
              { text: 'Dropdown Menu', link: '/docs/components/dropdown-menu' },
              { text: 'Hover Card', link: '/docs/components/hover-card' },
              { text: 'Menubar', link: '/docs/components/menubar' },
              {
                text: 'Navigation Menu',
                link: '/docs/components/navigation-menu',
              },
              { text: 'Pagination', link: '/docs/components/pagination' },
              { text: 'Popover', link: '/docs/components/popover' },
              { text: 'Progress', link: '/docs/components/progress' },
              { text: 'Scroll Area', link: '/docs/components/scroll-area' },
              { text: 'Separator', link: '/docs/components/separator' },
              { text: 'Splitter', link: '/docs/components/splitter' },
              {
                text: `Stepper ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/stepper',
              },
              { text: 'Tabs', link: '/docs/components/tabs' },
              { text: 'Toast', link: '/docs/components/toast' },
              { text: 'Toolbar', link: '/docs/components/toolbar' },
              { text: 'Tooltip', link: '/docs/components/tooltip' },
              {
                text: `Tree ${BadgeHTML('Alpha', true)}`,
                link: '/docs/components/tree',
              },
            ],
          },
        ],
      },
      {
        text: 'Utilities',
        icon: 'lucide:wrench',
        items: [
          {
            text: 'Component',
            items: [
              { text: 'Config Provider', link: '/docs/utilities/config-provider' },
              { text: 'Focus Scope', link: '/docs/utilities/focus-scope' },
              { text: 'Presence', link: '/docs/utilities/presence' },
              { text: 'Primitive', link: '/docs/utilities/primitive' },
              { text: 'Slot', link: '/docs/utilities/slot' },
              { text: 'Visually Hidden', link: '/docs/utilities/visually-hidden' },
            ],
          },
          {
            text: 'Composable',
            items: [
              { text: 'useId', link: '/docs/utilities/use-id' },
              {
                text: 'useDateFormatter',
                link: '/docs/utilities/use-date-formatter',
              },
              {
                text: 'useEmitAsProps',
                link: '/docs/utilities/use-emit-as-props',
              },
              { text: 'useFilter', link: '/docs/utilities/use-filter' },
              {
                text: 'useForwardExpose',
                link: '/docs/utilities/use-forward-expose',
              },
              {
                text: 'useForwardProps',
                link: '/docs/utilities/use-forward-props',
              },
              {
                text: 'useForwardPropsEmits',
                link: '/docs/utilities/use-forward-props-emits',
              },
            ],
          },
        ],
      },
      {
        text: 'Examples',
        icon: 'lucide:square-dashed-mouse-pointer',
        link: '/examples/checkbox-group',
        items: [
          {
            text: 'Checkbox',
            items: [
              { text: 'Checkbox Group', link: '/examples/checkbox-group' },
            ],
          },
          {
            text: 'Combobox',
            items: [
              {
                text: 'Combobox Tags Input',
                link: '/examples/combobox-tags-input',
              },
              {
                text: 'Combobox Textarea',
                link: '/examples/combobox-textarea',
              },
            ],
          },
          {
            text: 'Date',
            items: [
              {
                text: 'Date Picker Selection',
                link: '/examples/date-picker-selection',
              },
            ],
          },
          {
            text: 'Dialog',
            items: [
              {
                text: 'Dialog Command Menu',
                link: '/examples/dialog-command-menu',
              },
            ],
          },
          {
            text: 'Listbox',
            items: [
              { text: 'Listbox Transfer', link: '/examples/listbox-transfer' },
            ],
          },
          {
            text: 'Slider',
            items: [
              {
                text: 'Slider with Number Field',
                link: '/examples/slider-number-field',
              },
              { text: 'Slider Tooltip', link: '/examples/slider-tooltip' },
            ],
          },
          {
            text: 'Tooltip',
            items: [
              { text: 'Tooltip Cursor', link: '/examples/tooltip-cursor' },
            ],
          },
          {
            text: 'Progress',
            items: [
              {
                text: 'Circular Progress',
                link: '/examples/progress-circular',
              },
            ],
          },
        ],
      },
    ],

    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/unovue/radix-vue/edit/main/docs/content/:path',
    },
    carbonAds: {
      code: 'CW7DP2JW',
      placement: 'reka-uicom',
    },
  },
})
