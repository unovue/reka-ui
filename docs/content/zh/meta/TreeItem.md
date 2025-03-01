<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'li\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'level',
    'description': '<p>深度级别</p>\n',
    'type': 'number',
    'required': true
  },
  {
    'name': 'value',
    'description': '<p>赋予此项的值</p>\n',
    'type': 'Record<string, any>',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>值更改时调用的事件处理程序。在选择项时调用的事件处理程序。<br/>可以通过调用<code>event.preventDefault</code>来阻止它。</p>\n',
    'type': '[event: SelectEvent<Record<string, any>>]'
  },
  {
    'name': 'toggle',
    'description': '<p>值更改时调用的事件处理程序。在选择项时调用的事件处理程序。<br/>可以通过调用<code>event.preventDefault</code>来阻止它。</p>\n',
    'type': '[event: ToggleEvent<Record<string, any>>]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'isExpanded',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'isSelected',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'isIndeterminate',
    'description': '',
    'type': 'boolean | undefined'
  },
  {
    'name': 'handleToggle',
    'description': '',
    'type': ''
  },
  {
    'name': 'handleSelect',
    'description': '',
    'type': ''
  }
]" />
