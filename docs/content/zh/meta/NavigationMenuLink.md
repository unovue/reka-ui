<PropsTable :data="[
  {
    'name': 'active',
    'description': '<p>用于将链接标识为当前活动页面。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'a\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>当用户选择链接时调用事件处理程序（通过鼠标或键盘）。\n在此处理程序中调用 <code>event.preventDefault</code> 将阻止导航菜单在选择该链接时关闭。</p>\n',
    'type': '[payload: CustomEvent<{ originalEvent: Event; }>]'
  }
]" />
