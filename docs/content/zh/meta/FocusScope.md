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
    'name': 'loop',
    'description': '<p>当<code>true</code>时，从最后一项开始的 Tab 键将聚焦第一个 Tabbable\n而从第一项开始的shift+ Tab 键将聚焦最后一个 Tabbable。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'trapped',
    'description': '<p>如果<code>true</code>，则焦点无法通过键盘、指针或程序聚焦离开焦点范围。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'mountAutoFocus',
    'description': '<p>在自动聚焦挂载时调用事件处理程序。可被阻止。</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'unmountAutoFocus',
    'description': '<p>在卸载时自动聚焦时调用事件处理程序。可被阻止。</p>\n',
    'type': '[event: Event]'
  }
]" />
