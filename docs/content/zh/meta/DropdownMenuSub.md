<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>初始渲染时下拉框的打开状态。不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false
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
