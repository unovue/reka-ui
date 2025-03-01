<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'div\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>最初呈现 pin 输入时的默认值。当您不需要控制其检查状态时使用。</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>列表框的读取方向（如果适用）。<br/>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与 pin 输入交互</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>元素的 id</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'mask',
    'description': '<p>当<code>true</code>时，pin 输入将被视为密码。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>Pin 输入的受控选中状态。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'string[] | null',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>字段的名称。作为其拥有表单作为名称/值对的一部分提交。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'otp',
    'description': '<p>当<code>true</code>时，移动设备将从消息或剪贴板中自动检测OTP，并启用自动完成字段。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>用于空 pin 输入的占位。</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'\''
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'type',
    'description': '<p>输入的输入类型。</p>\n',
    'type': '\'number\' | \'text\'',
    'required': false,
    'default': '\'text\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'complete',
    'description': '',
    'type': '[value: string[]]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[value: string[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'string[]'
  }
]" />
