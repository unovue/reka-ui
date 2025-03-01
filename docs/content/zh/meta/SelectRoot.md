<PropsTable :data="[
  {
    'name': 'autocomplete',
    'description': '<p>原生 html input <code>autocomplete</code> 属性。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'by',
    'description': '<p>按特定字段比较对象，或传递您自己的比较函数以完全控制对象的比较方式。</p>\n',
    'type': 'string | ((a: AcceptableValue, b: AcceptableValue) => boolean)',
    'required': false
  },
  {
    'name': 'defaultOpen',
    'description': '<p>选择初始渲染时的打开状态。当您不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>初始渲染时选择的值。当您不需要控制选择的状态时使用</p>\n',
    'type': 'AcceptableValue | AcceptableValue[]',
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
    'description': '<p>当<code>true</code>时，阻止用户与 Select 交互</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>选择的受控值。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'AcceptableValue | AcceptableValue[]',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>是否可以选择多个选项。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>字段的名称。作为其拥有表单作为名称/值对的一部分提交。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'open',
    'description': '<p>Select的受控打开状态。可以绑定为<code>v-model:open</code>。</p>\n',
    'type': 'boolean',
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
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[value: AcceptableValue]'
  },
  {
    'name': 'update:open',
    'description': '<p>上下文菜单的打开状态更改时调用的事件处理程序。</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'AcceptableValue | AcceptableValue[] | undefined'
  },
  {
    'name': 'open',
    'description': '<p>当前打开状态</p>\n',
    'type': 'boolean'
  }
]" />
