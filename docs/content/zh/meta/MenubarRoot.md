<PropsTable :data="[
  {
    'name': 'defaultValue',
    'description': '<p>初始渲染时应打开的菜单的值。在不需要控制值状态时使用。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>适用时组合框的读取方向。如果省略，则从<code>ConfigProvider</code>全局继承或采用LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'loop',
    'description': '<p>当<code>true</code>时，键盘导航将从最后一项循环到第一项，反之亦然。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the menu to open. Can be used as <code>v-model</code>.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'string'
  }
]" />
