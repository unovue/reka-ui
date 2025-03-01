<PropsTable :data="[
  {
    'name': 'activationMode',
    'description': '<p>The activation event of the editable field</p>\n',
    'type': '\'dblclick\' | \'focus\' | \'none\'',
    'required': false,
    'default': '\'focus\''
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
    'name': 'autoResize',
    'description': '<p>可编辑字段是否应自动调整大小</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'defaultValue',
    'description': '<p>可编辑字段的默认值</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>可编辑字段的读取方向（如果适用）。<br>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>是否禁用可编辑字段</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'id',
    'description': '<p>字段的 ID</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'maxLength',
    'description': '<p>允许的最大字符数</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>可编辑字段的值</p>\n',
    'type': 'string | null',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>字段的名称。作为其拥有表单作为名称/值对的一部分提交。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>可编辑字段的占位</p>\n',
    'type': 'string | { edit: string; preview: string; }',
    'required': false,
    'default': '\'Enter text...\''
  },
  {
    'name': 'readonly',
    'description': '<p>可编辑字段是否为只读</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'selectOnFocus',
    'description': '<p>是否在聚焦输入时选择输入中的文本。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'startWithEditMode',
    'description': '<p>是否在编辑模式处于活动状态的情况下启动</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'submitMode',
    'description': '<p>可编辑字段的提交事件</p>\n',
    'type': '\'blur\' | \'none\' | \'enter\' | \'both\'',
    'required': false,
    'default': '\'blur\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'submit',
    'description': '<p>提交值时调用的事件处理程序</p>\n',
    'type': '[value: string | null]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>每当值更改时调用的事件处理程序</p>\n',
    'type': '[value: string]'
  },
  {
    'name': 'update:state',
    'description': '<p>当可编辑字段更改状态时调用的事件处理程序</p>\n',
    'type': '[state: \'cancel\' | \'submit\' | \'edit\']'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'isEditing',
    'description': '<p>可编辑字段是否处于编辑模式</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'modelValue',
    'description': '<p>可编辑字段的值</p>\n',
    'type': 'string | null | undefined'
  },
  {
    'name': 'isEmpty',
    'description': '<p>可编辑字段是否为空</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'submit',
    'description': '<p>用于提交可编辑字段的函数</p>\n',
    'type': ''
  },
  {
    'name': 'cancel',
    'description': '<p>取消可编辑字段值的函数</p>\n',
    'type': ''
  },
  {
    'name': 'edit',
    'description': '<p>在编辑模式下设置可编辑字段的函数</p>\n',
    'type': ''
  }
]" />

<MethodsTable :data="[
  {
    'name': 'submit',
    'description': '<p>用于提交可编辑字段的函数</p>\n',
    'type': '() => void'
  },
  {
    'name': 'cancel',
    'description': '<p>取消可编辑字段值的函数</p>\n',
    'type': '() => void'
  },
  {
    'name': 'edit',
    'description': '<p>在编辑模式下设置可编辑字段的函数</p>\n',
    'type': '() => void'
  }
]" />
