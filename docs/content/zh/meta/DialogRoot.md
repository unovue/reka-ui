<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>对话框最初呈现时的打开状态。在不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modal',
    'description': '<p>对话框的模式。当设置为<code>true</code>时，与外部元素的交互将被禁用，并且只有对话框内容对屏幕阅读器可见。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'open',
    'description': '<p>对话框的受控打开状态。可以绑定为 <code>v-model:open</code>。</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>对话框的打开状态更改时调用的事件处理程序。</p>\n',
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
