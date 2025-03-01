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
    'name': 'defaultValue',
    'description': '<p>最初呈现时应处于活动状态的菜单项的值。\n在不需要控制值状态时使用。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>要激活的子菜单项的受控值。可用作 <code>v-model</code>。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>菜单的方向。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[value: string]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'string'
  }
]" />
