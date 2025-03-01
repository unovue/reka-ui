<PropsTable :data="[
  {
    'name': 'activationMode',
    'description': '<p>选项卡是自动激活（对焦）还是手动激活（单击）。</p>\n',
    'type': '\'automatic\' | \'manual\'',
    'required': false,
    'default': '\'automatic\''
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
    'name': 'defaultValue',
    'description': '<p>初始渲染时应处于活动状态的选项卡的值。当您不需要控制选项卡的状态时使用</p>\n',
    'type': 'string | number',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>列表框的读取方向（如果适用）。<br/>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>要激活的选项卡的受控值。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'string | number',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>选项卡的方向。\n主要与箭头导航是相应的（左右与上下）</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
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
    'description': '<p>值更改时调用的事件处理程序</p>\n',
    'type': '[payload: StringOrNumber]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'string | number'
  }
]" />
