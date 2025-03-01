<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>工具提示初始渲染时的打开状态。\n当您不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'delayDuration',
    'description': '<p>覆盖给定给<code>Provider</code>的持续时间以自定义特定工具提示的打开延迟。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'disableClosingTrigger',
    'description': '<p>当<code>true</code>时，点击触发器不会关闭内容。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，禁用工具提示</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disableHoverableContent',
    'description': '<p>阻止 Tooltip.Content 在悬停时保持打开状态。\n禁用它会产生可访问性后果。从 Tooltip.Provider 继承\n。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'ignoreNonKeyboardFocus',
    'description': '<p>如果焦点不是来自键盘，则通过与<code> :focus-visible</code>选择器匹配来防止工具提示打开。\n如果您想在切换浏览器选项卡或关闭对话框时避免打开它，这很有用。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'open',
    'description': '<p>工具提示的受控打开状态。</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>工具提示的打开状态更改时调用的事件处理程序。</p>\n',
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
