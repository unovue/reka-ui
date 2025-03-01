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
    'description': '<p>提供给单元格触发器的日期值</p>\n',
    'type': 'DateValue',
    'required': true
  },
  {
    'name': 'month',
    'description': '<p>呈现单元格的月份</p>\n',
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
  }
]" />
