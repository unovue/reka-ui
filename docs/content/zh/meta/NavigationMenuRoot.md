<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'nav\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>最初呈现时应处于活动状态的菜单项的值。\n在不需要控制值状态时使用。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'delayDuration',
    'description': '<p>从指针进入触发器到工具提示打开的持续时间。</p>\n',
    'type': 'number',
    'required': false,
    'default': '200'
  },
  {
    'name': 'dir',
    'description': '<p>适用时组合框的读取方向。如果省略，则从<code>ConfigProvider</code>全局继承或采用LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disableClickTrigger',
    'description': '<p>如果<code>true</code>，则无法通过单击触发器打开菜单</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disableHoverTrigger',
    'description': '<p>如果<code>true</code>，则无法通过悬停触发器打开菜单</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disablePointerLeaveClose',
    'description': '<p>如果<code>true</code>，则无法通过指针离开事件关闭菜单</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>要激活的菜单项的受控值。可用作<code>v-model</code>。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>菜单的方向。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  },
  {
    'name': 'skipDelayDuration',
    'description': '<p>用户必须输入另一个触发器而不再次产生延迟的时间。</p>\n',
    'type': 'number',
    'required': false,
    'default': '300'
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
    'description': '<p>值更改时调用的事件处理程序。</p>\n',
    'type': '[value: string]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前输入值</p>\n',
    'type': 'string'
  }
]" />
