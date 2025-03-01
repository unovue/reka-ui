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
    'name': 'defaultValue',
    'description': '',
    'type': 'number',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与数字字段交互。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'formatOptions',
    'description': '<p>数字字段中显示的值的格式选项。这也会影响用户允许键入的字符。</p>\n',
    'type': 'NumberFormatOptions',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>元素的 id</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'locale',
    'description': '<p>用于设置日期格式的区域设置</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'max',
    'description': '<p>输入允许的最大值。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'min',
    'description': '<p>输入允许的最小值。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '',
    'type': 'number | null',
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
    'name': 'step',
    'description': '<p>输入值随每次递增或递减“刻度”而变化的量。</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[val: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '',
    'type': 'number'
  },
  {
    'name': 'textValue',
    'description': '',
    'type': 'string'
  }
]" />
