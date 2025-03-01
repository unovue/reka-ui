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
    'description': '<p>初始渲染时应检查的单选项的值。</p>\n<p>当您不需要控制单选项的状态时使用。</p>\n',
    'type': 'AcceptableValue',
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
    'description': '<p>当<code>true</code>时，阻止用户与单选项交互。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'loop',
    'description': '<p>当<code>true</code>时，键盘导航将从最后一项循环到第一项，反之亦然。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the radio item to check. Can be binded as <code>v-model</code>.</p>\n',
    'type': 'AcceptableValue',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>字段的名称。作为其拥有表单作为名称/值对的一部分提交。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>组件的方向。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>当单选组值更改时调用的事件处理程序</p>\n',
    'type': '[payload: string]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'null | string | number | Record<string, any>'
  }
]" />
