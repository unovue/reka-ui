import { defineConfig } from 'vitepress'
import { version } from '../../package.json'
import {
  legacyLink,
  legacyVersion,
  releases,
} from '../meta'
import { BadgeHTML } from '.'

export default defineConfig({
  lang: 'zh',
  description: '使用 Vue 构建高质量设计系统和 Web 应用程序的无样式、无障碍组件',
  themeConfig: {
    nav: [
      { text: '文档', link: '/zh/docs/overview/getting-started' },
      { text: '示例', link: '/zh/examples/checkbox-group' },
      { text: '样例', link: '/zh/showcase' },
      {
        text: `v${version}`,
        items: [
          { text: '发布日志 ', link: releases },
          { text: legacyVersion, link: legacyLink },
        ],
      },
    ],

    sidebar: [
      {
        text: '总览',
        icon: 'lucide:rocket',
        base: '/zh/docs/overview/',
        items: [
          { text: '介绍', link: '/introduction' },
          { text: '开始', link: '/getting-started' },
          { text: '安装', link: '/installation' },
          { text: '可访问性', link: '/accessibility' },
          { text: '版本', link: '/releases' },
        ],
      },
      {
        text: '指南',
        icon: 'lucide:book-open',
        base: '/zh/docs/guides/',
        items: [
          { text: '设置样式', link: '/styling' },
          { text: '动画/渐变', link: '/animation' },
          { text: '组合式', link: '/composition' },
          { text: `受控状态 ${BadgeHTML('New')}`, link: '/controlled-state' },
          { text: '服务端渲染', link: '/server-side-rendering' },
          { text: '命名空间', link: '/namespaced-components' },
          { text: '日期处理', link: '/dates' },
          { text: '国际化 (RTL)', link: '/i18n' },
          {
            text: `注入上下文 ${BadgeHTML('New')}`,
            link: '/guides/inject-context',
          },
          {
            text: `可视化 ${BadgeHTML('New')}`,
            link: '/guides/virtualization',
          },
          {
            text: `迁移 ${BadgeHTML('New')}`,
            link: '/guides/migration',
          },
        ],
      },
      {
        text: '组件',
        icon: 'lucide:box',
        base: '/zh/docs/components/',
        items: [
          {
            text: '表单',
            items: [
              { text: 'Checkbox 复选框', link: '/checkbox' },
              { text: 'Combobox 组合框', link: '/combobox' },
              { text: `Editable 可编辑框`, link: '/editable' },
              { text: `Listbox 列表框`, link: '/listbox' },
              { text: `Number Field 数字字段`, link: '/number-field' },
              { text: 'Label 标签', link: '/label' },
              { text: 'Pin Input Pin 输入', link: '/pin-input' },
              { text: 'Radio Group 单选按钮组', link: '/radio-group' },
              { text: 'Select 选择器', link: '/select' },
              { text: 'Slider 滑块', link: '/slider' },
              { text: 'Switch 开关', link: '/switch' },
              { text: 'Tags Input 标签输入', link: '/tags-input' },
              { text: 'Toggle 切换按钮', link: '/toggle' },
              { text: 'Toggle Group 切换按钮组', link: '/toggle-group' },
            ],
          },
          {
            text: '时间',
            items: [
              {
                text: `Calendar 日历 ${BadgeHTML('Alpha', true)}`,
                link: '/calendar',
              },
              {
                text: `Date Field 日期字段 ${BadgeHTML('Alpha', true)}`,
                link: '/date-field',
              },
              {
                text: `Date Picker 日期选择器 ${BadgeHTML('Alpha', true)}`,
                link: '/date-picker',
              },
              {
                text: `Date Range Field 日期范围字段 ${BadgeHTML('Alpha', true)}`,
                link: '/date-range-field',
              },
              {
                text: `Date Range Picker 日期范围选择器 ${BadgeHTML('Alpha', true)}`,
                link: '/date-range-picker',
              },
              {
                text: `Range Calendar 范围日历 ${BadgeHTML('Alpha', true)}`,
                link: '/range-calendar',
              },
              {
                text: `Time Field 时间字段 ${BadgeHTML('Alpha', true)}`,
                link: '/time-field',
              },
            ],
          },
          {
            text: '通用',
            items: [
              { text: 'Accordion 手风琴面板', link: '/accordion' },
              { text: 'Alert Dialog 警报对话框', link: '/alert-dialog' },
              { text: 'Aspect Ratio 横纵比', link: '/aspect-ratio' },
              { text: 'Avatar 头像', link: '/avatar' },
              { text: 'Collapsible 折叠面板', link: '/collapsible' },
              { text: 'Context Menu 上下文菜单', link: '/context-menu' },
              { text: 'Dialog 对话框', link: '/dialog' },
              { text: 'Dropdown Menu 下拉菜单', link: '/dropdown-menu' },
              { text: 'Hover Card 悬停卡片', link: '/hover-card' },
              { text: 'Menubar 菜单栏', link: '/menubar' },
              {
                text: 'Navigation Menu 导航菜单',
                link: '/navigation-menu',
              },
              { text: 'Pagination 分页', link: '/pagination' },
              { text: 'Popover 弹出面板', link: '/popover' },
              { text: 'Progress 进度', link: '/progress' },
              { text: 'Scroll Area 滚动区域', link: '/scroll-area' },
              { text: 'Separator 分割线', link: '/separator' },
              { text: 'Splitter 拆分器', link: '/splitter' },
              {
                text: `Stepper 步骤 ${BadgeHTML('Alpha', true)}`,
                link: '/stepper',
              },
              { text: 'Tabs 选项卡', link: '/tabs' },
              { text: 'Toast 轻提示', link: '/toast' },
              { text: 'Toolbar 工具栏', link: '/toolbar' },
              { text: 'Tooltip 工具提示', link: '/tooltip' },
              {
                text: `Tree 树 ${BadgeHTML('Alpha', true)}`,
                link: '/tree',
              },
            ],
          },
        ],
      },
      {
        text: '通用工具',
        icon: 'lucide:wrench',
        base: '/zh/docs/utilities/',
        items: [
          {
            text: '组件',
            items: [
              { text: 'Config Provider 配置下发', link: '/config-provider' },
              { text: 'Focus Scope 聚焦作用域', link: '/focus-scope' },
              { text: 'Presence', link: '/presence' },
              { text: 'Primitive', link: '/primitive' },
              { text: 'Slot 插槽', link: '/slot' },
              { text: 'Visually Hidden 视觉隐藏', link: '/visually-hidden' },
            ],
          },
          {
            text: '组合式函数',
            items: [
              { text: 'useId', link: '/use-id' },
              {
                text: 'useDateFormatter',
                link: '/use-date-formatter',
              },
              {
                text: 'useEmitAsProps',
                link: '/use-emit-as-props',
              },
              { text: 'useFilter', link: '/use-filter' },
              {
                text: 'useForwardExpose',
                link: '/use-forward-expose',
              },
              {
                text: 'useForwardProps',
                link: '/use-forward-props',
              },
              {
                text: 'useForwardPropsEmits',
                link: '/use-forward-props-emits',
              },
            ],
          },
        ],
      },
      {
        text: '示例',
        icon: 'lucide:square-dashed-mouse-pointer',
        link: '/zh/examples/checkbox-group',
        base: '/zh/examples/',
        items: [
          {
            text: '复选框',
            items: [
              { text: '复选框组', link: '/checkbox-group' },
            ],
          },
          {
            text: '组合框',
            items: [
              {
                text: '标签输入的组合框',
                link: '/combobox-tags-input',
              },
              {
                text: '组合框文本域',
                link: '/combobox-textarea',
              },
            ],
          },
          {
            text: '日期',
            items: [
              {
                text: '日期范围选择器',
                link: '/date-picker-selection',
              },
            ],
          },
          {
            text: '对话框',
            items: [
              {
                text: '对话框命令菜单',
                link: '/dialog-command-menu',
              },
            ],
          },
          {
            text: '列表框',
            items: [
              { text: '穿梭框', link: '/listbox-transfer' },
            ],
          },
          {
            text: '滑块',
            items: [
              {
                text: '带数字字段的滑块',
                link: '/slider-number-field',
              },
              { text: '滑块提示', link: '/slider-tooltip' },
            ],
          },
          {
            text: '工具提示',
            items: [
              { text: '光标提示', link: '/tooltip-cursor' },
            ],
          },
          {
            text: '进度条',
            items: [
              {
                text: '圆形进度条',
                link: '/progress-circular',
              },
            ],
          },
        ],
      },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonAriaLabel: '搜索文档',
            buttonText: '搜索',
          },
          modal: {
            displayDetails: '显示细节列表',
            resetButtonTitle: '重置搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '无法找到相关结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上',
              navigateDownKeyAriaLabel: '下',
              closeText: '关闭',
            },
          },
        },
      },
    },
    editLink: {
      pattern: 'https://github.com/radix-vue/radix-vue/edit/main/docs/content/:path',
      text: '在 GitHub 上编辑此页面',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
})
