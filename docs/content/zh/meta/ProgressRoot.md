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
    'name': 'getValueLabel',
    'description': '<p>获取以人类可读格式表示当前值的可访问标签文本的函数。</p>\n<p>如果未提供，值标签将被读取为数值作为最大值的百分比。</p>\n',
    'type': '((value: number, max: number) => string)',
    'required': false,
    'default': '`${Math.round((value / max) * DEFAULT_MAX)}%`'
  },
  {
    'name': 'max',
    'description': '<p>The maximum progress value.</p>\n',
    'type': 'number',
    'required': false,
    'default': 'DEFAULT_MAX'
  },
  {
    'name': 'modelValue',
    'description': '<p>进度值。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'number | null',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:max',
    'description': '<p>最大值更改时调用的事件处理程序</p>\n',
    'type': '[value: number]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>进度值更改时调用的事件处理程序</p>\n',
    'type': '[value: string[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'number | null | undefined'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'getValueLabel',
    'description': '<p>获取以人类可读格式表示当前值的可访问标签文本的函数。</p>\n<p>如果未提供，值标签将被读取为数值作为最大值的百分比。</p>\n',
    'type': '(value: number, max: number) => string'
  }
]" />
