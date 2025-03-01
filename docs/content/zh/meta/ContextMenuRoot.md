<PropsTable :data="[
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
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>子菜单的打开状态更改时调用的事件处理程序。</p>\n',
    'type': '[payload: boolean]'
  }
]" />
