<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'button\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与单选项交互。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'id',
    'description': '',
    'type': 'string',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>字段的名称。作为其拥有表单作为名称/值对的一部分提交。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'value',
    'description': '<p>使用<code>name</code>提交时作为 data 给出的值。</p>\n',
    'type': 'AcceptableValue',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>当用户选择链接时调用事件处理程序（通过鼠标或键盘）。\n在此处理程序中调用 <code>event.preventDefault</code> 将阻止导航菜单在选择该链接时关闭。</p>\n',
    'type': '[event: SelectEvent]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'checked',
    'description': '<p>当前选中状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'required',
    'description': '<p>必需状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'disabled',
    'description': '<p>禁用状态</p>\n',
    'type': 'boolean'
  }
]" />
