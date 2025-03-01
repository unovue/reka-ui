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
    'name': 'completed',
    'description': '<p>显示该步骤是否完成。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与该步骤交互。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'step',
    'description': '<p>将步进器项与索引相关联的唯一值</p>\n',
    'type': 'number',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'state',
    'description': '<p>步进器项的当前状态</p>\n',
    'type': '\'active\' | \'completed\' | \'inactive\''
  }
]" />
