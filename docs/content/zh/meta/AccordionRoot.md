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
    'name': 'collapsible',
    'description': '<p>当 type 为 “single” 时，允许在单击打开项目的触发器时关闭内容。\n当 type 为 “multiple” 时，此 prop 无效。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'defaultValue',
    'description': '<p>项的默认活动值。</p>\n<p>当您不需要控制项的状态时使用。</p>\n',
    'type': 'string | string[]',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>折叠面板的读取方向（如果适用）。如果省略，则采用 LTR （从左到右） 读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>如果<code>true</code>，则阻止用户与折叠面板及其所有项目交互</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modelValue',
    'description': '<p>活动项的受控值。</p>\n<p>当您需要控制项的状态时，请使用此选项。可与 <code>v-model</code>绑定</p>\n',
    'type': 'string | string[]',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>折叠面板的方向。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'vertical\''
  },
  {
    'name': 'type',
    'description': '<p>确定一次可以选择“单个”还是“多个”项。</p>\n<p>这个 prop 将覆盖从 <code>modelValue</code> 和<code>defaultValue</code>推断出的类型。</p>\n',
    'type': '\'single\' | \'multiple\'',
    'required': false
  },
  {
    'name': 'unmountOnHide',
    'description': '<p>如果<code>true</code>，则元素将在 closed 状态下卸载。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>当项的展开状态发生更改时调用的事件处理程序</p>\n',
    'type': '[value: string | string[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前活动值</p>\n',
    'type': 'AcceptableValue | AcceptableValue[] | undefined'
  }
]" />
