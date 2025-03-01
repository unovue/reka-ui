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
    'description': '<p>如果<code>true</code>，则阻止用户与项目交互。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'textValue',
    'description': '<p>用于预先输入目的的可选文本。</p>\n<p>默认情况下，预先输入行为将使用<code>SelectItemText</code>部件的<code>.textContent</code>。</p>\n<p>当内容复杂或内部有非文本内容时使用此选项。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'value',
    'description': '<p>使用<code>name</code>提交时作为 data 给出的值。</p>\n',
    'type': 'AcceptableValue',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>值更改时调用的事件处理程序。在选择项时调用的事件处理程序。<br/>可以通过调用<code>event.preventDefault</code>来阻止它。</p>\n',
    'type': '[event: SelectEvent<AcceptableValue>]'
  }
]" />
