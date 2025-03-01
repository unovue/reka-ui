<PropsTable :data="[
  {
    'name': 'addOnBlur',
    'description': '<p>当<code>true</code>时允许添加标签失焦时输入</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'addOnPaste',
    'description': '<p>当<code>true</code>时，允许粘贴添加标签。与 delimiter prop 一起工作。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'addOnTab',
    'description': '<p>当<code>true</code>允许在 tab 上按下键盘添加标签</p>\n',
    'type': 'boolean',
    'required': false
  },
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
    'name': 'convertValue',
    'description': '<p>将输入值转换为所需的类型。使用对象作为值并使用<code>TagsInputInput</code>时是强制性的。</p>\n',
    'type': '((value: string) => AcceptableInputValue)',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>应该添加的标签的值。当您不需要控制标签输入的状态时使用</p>\n',
    'type': 'AcceptableInputValue[]',
    'required': false,
    'default': '[]'
  },
  {
    'name': 'delimiter',
    'description': '<p>触发添加新标签的字符或正则表达式。也用于拆分<code>@paste</code>事件的标签</p>\n',
    'type': 'string | RegExp',
    'required': false,
    'default': '\',\''
  },
  {
    'name': 'dir',
    'description': '<p>列表框的读取方向（如果适用）。<br/>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与标签输入交互。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'displayValue',
    'description': '<p>显示标签的值。当您想对值应用修改（例如添加后缀）或使用对象作为值时很有用</p>\n',
    'type': '((value: AcceptableInputValue) => string)',
    'required': false,
    'default': 'value.toString()'
  },
  {
    'name': 'duplicate',
    'description': '<p>当<code>true</code>时，允许重复标签。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'id',
    'description': '',
    'type': 'string',
    'required': false
  },
  {
    'name': 'max',
    'description': '<p>最大标签数。</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'modelValue',
    'description': '<p>标签输入的受控值。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'AcceptableInputValue[] | null',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>字段的名称。作为其拥有表单作为名称/值对的一部分提交。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'addTag',
    'description': '<p>添加标签时调用的事件处理程序</p>\n',
    'type': '[payload: AcceptableInputValue]'
  },
  {
    'name': 'invalid',
    'description': '<p>值无效时调用的事件处理程序</p>\n',
    'type': '[payload: AcceptableInputValue]'
  },
  {
    'name': 'removeTag',
    'description': '<p>删除标签时调用的事件处理程序</p>\n',
    'type': '[payload: AcceptableInputValue]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序</p>\n',
    'type': '[payload: AcceptableInputValue[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'string | Record<string, any>'
  }
]" />
