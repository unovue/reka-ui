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
    'name': 'defaultOpen',
    'description': '<p>组合框最初呈现时的打开状态。<br/>在不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
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
    'name': 'ignoreFilter',
    'description': '<p>如果<code>true</code>，则禁用默认过滤器</p>\n',
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
    'name': 'open',
    'description': '<p>Combobox 的受控打开状态。可以与 <code>v-model:open</code>绑定。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'resetSearchTermOnBlur',
    'description': '<p>是否在 Combobox 输入模糊时重置 searchTerm</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'resetSearchTermOnSelect',
    'description': '<p>是否在选择 Combobox 值时重置 searchTerm</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'highlight',
    'description': '<p>突出显示的元素更改时的事件处理程序。</p>\n',
    'type': '[payload: { ref: HTMLElement; value: AcceptableValue; }]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[value: AcceptableValue]'
  },
  {
    'name': 'update:open',
    'description': '<p>当组合框的打开状态发生变化时调用的事件处理程序。</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>当前打开状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'modelValue',
    'description': '<p>当前活动值</p>\n',
    'type': 'AcceptableValue | AcceptableValue[]'
  }
]" />
