<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>对话框最初呈现时的打开状态。在不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false
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
