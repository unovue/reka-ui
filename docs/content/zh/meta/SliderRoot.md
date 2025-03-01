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
    'description': '<p>初始渲染时滑块的值。当您不需要控制滑块的状态时使用。</p>\n',
    'type': 'number[]',
    'required': false,
    'default': '[0]'
  },
  {
    'name': 'dir',
    'description': '<p>列表框的读取方向（如果适用）。<br/>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与滑块交互。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'inverted',
    'description': '<p>滑块是否在视觉上倒置。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'max',
    'description': '<p>范围的最大值。</p>\n',
    'type': 'number',
    'required': false,
    'default': '100'
  },
  {
    'name': 'min',
    'description': '<p>范围的最小值。</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'minStepsBetweenThumbs',
    'description': '<p>多个滑钮之间允许的最小步长。</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'modelValue',
    'description': '<p>滑块的受控值。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'number[] | null',
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
    'description': '<p>滑块的方向。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'step',
    'description': '<p>步进间隔。</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>滑块值更改时调用的事件处理程序</p>\n',
    'type': '[payload: number[]]'
  },
  {
    'name': 'valueCommit',
    'description': '<p>当交互结束时值发生变化时调用事件处理程序。</p>\n<p>当您只需要捕获最终值时很有用，例如更新后端服务。</p>\n',
    'type': '[payload: number[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前滑块值</p>\n',
    'type': 'number[] | null'
  }
]" />
