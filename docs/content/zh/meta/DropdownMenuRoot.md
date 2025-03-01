<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>初始渲染时下拉框的打开状态。不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>适用时组合框的读取方向。如果省略，则从<code>ConfigProvider</code>全局继承或采用LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'modal',
    'description': '<p>下拉框的模式。当设置为<code>true</code>时，与外部元素的交互将被禁用，只有菜单内容对屏幕阅读器可见。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'open',
    'description': '<p>菜单的受控打开状态。可用作<code>v-model:open</code>。</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>子菜单的打开状态更改时调用的事件处理程序。</p>\n',
    'type': '[payload: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>当前打开状态</p>\n',
    'type': 'boolean'
  }
]" />
