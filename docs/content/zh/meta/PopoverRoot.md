<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>弹出面板最初呈现时的打开状态。在不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modal',
    'description': '<p>弹出框的模式。如果设置为 true，则将禁用与外部元素的交互，并且只有弹出面板内容对屏幕阅读器可见。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'open',
    'description': '<p>弹出框的受控打开状态。</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>弹出面板的打开状态更改时调用的事件处理程序。</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>当前打开状态</p>\n',
    'type': 'boolean'
  }
]" />
