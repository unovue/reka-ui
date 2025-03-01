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
    'name': 'by',
    'description': '<p>按特定字段比较对象，或传递您自己的比较函数以完全控制对象的比较方式。</p>\n',
    'type': 'string | ((a: AcceptableValue, b: AcceptableValue) => boolean)',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>初始渲染时 listbox 的值。在不需要控制 Listbox 的状态时使用</p>\n',
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
    'description': '<p>如果<code>true</code>，则阻止用户与 listbox 交互</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'highlightOnHover',
    'description': '<p>如果<code>true</code>，则将鼠标悬停在 item 上将触发高亮显示</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>列表框的受控值。可以与<code>v-model</code> 绑定。</p>\n',
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
    'name': 'orientation',
    'description': '<p>列表框的方向。主要是这样，箭头导航会相应地进行（左&右 vs. 上&下）</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'vertical\''
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'selectionBehavior',
    'description': '<p>多个选择在集合中的行为方式。</p>\n',
    'type': '\'toggle\' | \'replace\'',
    'required': false,
    'default': '\'toggle\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'entryFocus',
    'description': '<p>容器聚焦时调用的事件处理程序。可被阻止。</p>\n',
    'type': '[event: CustomEvent<any>]'
  },
  {
    'name': 'highlight',
    'description': '<p>突出显示的元素更改时的事件处理程序。</p>\n',
    'type': '[payload: { ref: HTMLElement; value: AcceptableValue; }]'
  },
  {
    'name': 'leave',
    'description': '<p>鼠标离开容器时调用的事件处理程序</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[value: AcceptableValue]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前活动值</p>\n',
    'type': 'AcceptableValue | AcceptableValue[] | undefined'
  }
]" />
