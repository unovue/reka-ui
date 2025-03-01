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
    'name': 'autoSaveId',
    'description': '<p>用于通过<code>localStorage</code>自动保存组排列的唯一ID。</p>\n',
    'type': 'string | null',
    'required': false,
    'default': 'null'
  },
  {
    'name': 'direction',
    'description': '<p>拆分器的组方向。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': true
  },
  {
    'name': 'id',
    'description': '<p>组ID；未提供时回退到<code>useId</code>。</p>\n',
    'type': 'string | null',
    'required': false
  },
  {
    'name': 'keyboardResizeBy',
    'description': '<p>按箭头键时的步长。</p>\n',
    'type': 'number | null',
    'required': false,
    'default': '10'
  },
  {
    'name': 'storage',
    'description': '<p>自定义 Storage API；默认为localStorage</p>\n',
    'type': 'PanelGroupStorage',
    'required': false,
    'default': 'defaultStorage'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'layout',
    'description': '<p>组布局更改时调用的事件处理程序</p>\n',
    'type': '[val: number[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'layout',
    'description': '<p>当前布局大小</p>\n',
    'type': 'number[]'
  }
]" />
