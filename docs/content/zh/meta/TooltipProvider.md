<PropsTable :data="[
  {
    'name': 'delayDuration',
    'description': '<p>从指针进入触发器到工具提示打开的持续时间。</p>\n',
    'type': 'number',
    'required': false,
    'default': '700'
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
    'description': '<p>当<code>true</code>时，尝试悬停内容将导致工具提示在指针离开触发器时关闭。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'ignoreNonKeyboardFocus',
    'description': '<p>如果焦点不是来自键盘，则通过与<code> :focus-visible</code>选择器匹配来防止工具提示打开。\n如果您想在切换浏览器选项卡或关闭对话框时避免打开它，这很有用。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'skipDelayDuration',
    'description': '<p>用户必须输入另一个触发器而不再次产生延迟的时间。</p>\n',
    'type': 'number',
    'required': false,
    'default': '300'
  }
]" />
