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
    'description': '<p>禁用拖动滑钮</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hitAreaMargins',
    'description': '<p>在确定可调整大小的滑钮命中检测时允许这么多边距</p>\n',
    'type': 'PointerHitAreaMargins',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>滑钮ID（组内唯一）；未提供时回退到<code>useId</code></p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'tabindex',
    'description': '<p>滑钮的Tabindex</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'dragging',
    'description': '<p>拖动滑钮时调用的事件处理程序。</p>\n',
    'type': '[isDragging: boolean]'
  }
]" />
