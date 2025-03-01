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
    'description': '<p>初始渲染复选框时复选框的值。在不需要控制其值时使用。</p>\n',
    'type': 'AcceptableValue[]',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>项之间的导航方向。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>如果<code>true</code>，则阻止用户与复选框交互</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'loop',
    'description': '<p>键盘导航是否应循环</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>复选框的受控值。可以与 v-model 绑定。</p>\n',
    'type': 'AcceptableValue[]',
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
    'description': '<p>组的方向。主要是这样，箭头导航会相应地进行（左&右 vs. 上&下）</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'rovingFocus',
    'description': '<p>如果<code>false</code>，则使用箭头键在项之间导航将被禁用。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>当复选框的值更改时调用的事件处理程序。</p>\n',
    'type': '[value: AcceptableValue[]]'
  }
]" />
