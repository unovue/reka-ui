<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'div\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>是否在用户交互中禁用折叠项。\n如果<code>true</code>，则阻止用户与项目交互。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'unmountOnHide',
    'description': '<p>如果<code>true</code>，则元素将在 closed 状态下卸载。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'value',
    'description': '<p>折叠项的字符串值。折叠面板中的所有项都应使用唯一值。</p>\n',
    'type': 'string',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>当前打开状态</p>\n',
    'type': 'boolean'
  }
]" />
