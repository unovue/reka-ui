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
    'name': 'collapsedSize',
    'description': '<p>面板折叠时的尺寸。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'collapsible',
    'description': '<p>当面板调整到超出其<code>minSize</code>时应该折叠。当<code>true</code>时，它将折叠为<code>折叠大小</code>。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultSize',
    'description': '<p>面板的初始尺寸（数值在1-100之间）</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>面板ID（组内唯一）；未提供时回退到<code>useId</code></p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'maxSize',
    'description': '<p>面板的最大允许尺寸（数值在1-100之间）；默认为<code>100</code></p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'minSize',
    'description': '<p>面板的最小允许尺寸（数值在1-100之间）；默认为<code>10</code></p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'order',
    'description': '<p>组中面板的顺序；对于有条件地渲染面板的组是必需的</p>\n',
    'type': 'number',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'collapse',
    'description': '<p>折叠面板时调用的事件处理程序。</p>\n',
    'type': '[]'
  },
  {
    'name': 'expand',
    'description': '<p>展开面板时调用的事件处理程序。</p>\n',
    'type': '[]'
  },
  {
    'name': 'resize',
    'description': '<p>调整面板大小时调用的事件处理程序；size参数是1-100之间的数值。</p>\n',
    'type': '[size: number, prevSize: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'isCollapsed',
    'description': '<p>Is the panel collapsed</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isExpanded',
    'description': '<p>Is the panel expanded</p>\n',
    'type': 'boolean'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'collapse',
    'description': '<p>If panel is <code>collapsible</code>, collapse it fully.</p>\n',
    'type': '() => void'
  },
  {
    'name': 'expand',
    'description': '<p>If panel is currently collapsed, expand it to its most recent size.</p>\n',
    'type': '() => void'
  },
  {
    'name': 'getSize',
    'description': '<p>Gets the current size of the panel as a percentage (1 - 100).</p>\n',
    'type': '() => number'
  },
  {
    'name': 'resize',
    'description': '<p>Resize panel to the specified percentage (1 - 100).</p>\n',
    'type': '(size: number) => void'
  }
]" />
