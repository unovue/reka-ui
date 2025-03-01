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
    'name': 'prevPage',
    'description': '<p>要用于上一页的函数。覆盖在 <code>CalendarRoot</code> 上设置的 <code>prevPage</code> 函数。</p>\n',
    'type': '((placeholder: DateValue) => DateValue)',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'disabled',
    'description': '<p>当前禁用状态</p>\n',
    'type': 'boolean'
  }
]" />
