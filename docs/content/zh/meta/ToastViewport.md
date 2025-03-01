<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'ol\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hotkey',
    'description': '<p>用作将焦点移动到 Toast 视口的键盘快捷键。</p>\n',
    'type': 'string[]',
    'required': false,
    'default': '[\'F8\']'
  },
  {
    'name': 'label',
    'description': '<p>一个作者本地化的标签，用于在浏览页面地标时为屏幕阅读器用户提供上下文。可用于替换的<code>{hotkey}</code>占位。\n或者，您可以传入自定义函数来生成标签。</p>\n',
    'type': 'string | ((hotkey: string) => string)',
    'required': false,
    'default': '\'Notifications ({hotkey})\''
  }
]" />
