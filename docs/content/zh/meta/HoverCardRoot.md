<PropsTable :data="[
  {
    'name': 'closeDelay',
    'description': '<p>从鼠标离开触发器或内容到悬停卡关闭的持续时间。</p>\n',
    'type': 'number',
    'required': false,
    'default': '300'
  },
  {
    'name': 'defaultOpen',
    'description': '<p>悬停卡最初呈现时的打开状态。在不需要控制其打开状态时使用。</p>\n',
    'type': 'false',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'open',
    'description': '<p>悬停卡的受控打开状态。可以绑定为 <code>v-model:open</code>。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'openDelay',
    'description': '<p>从鼠标进入触发器到悬停卡打开的持续时间。</p>\n',
    'type': 'number',
    'required': false,
    'default': '700'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>当悬停卡的打开状态发生变化时调用的事件处理程序。</p>\n',
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
