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
    'name': 'day',
    'description': '',
    'type': 'DateValue',
    'required': true
  },
  {
    'name': 'month',
    'description': '',
    'type': 'DateValue',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'dayValue',
    'description': '<p>当天</p>\n',
    'type': 'string'
  },
  {
    'name': 'disabled',
    'description': '<p>当前禁用状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'selected',
    'description': '<p>当前选定状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'today',
    'description': '<p>当前今日状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'outsideView',
    'description': '<p>当前外部视图状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'outsideVisibleView',
    'description': '<p>当前外部可见视图状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'unavailable',
    'description': '<p>当前不可用状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'highlighted',
    'description': '<p>当前高亮状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'highlightedStart',
    'description': '<p>当前突出显示的开始状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'highlightedEnd',
    'description': '<p>当前突出显示的结尾状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'selectionStart',
    'description': '<p>当前选择开始状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'selectionEnd',
    'description': '<p>当前选择结尾状态</p>\n',
    'type': 'boolean'
  }
]" />
