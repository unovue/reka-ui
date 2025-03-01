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
    'description': '<p>初始渲染时应处于活动状态的步骤的值。当您不需要控制步骤的状态时使用。</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'dir',
    'description': '<p>列表框的读取方向（如果适用）。<br/>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'linear',
    'description': '<p>这些步骤是否必须按顺序完成。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'modelValue',
    'description': '<p>要激活的步骤的受控值。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>步骤布置的方向。\n主要和箭头导航是相应的（左右与上下）。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>值更改时调用的事件处理程序</p>\n',
    'type': '[payload: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>当前步骤</p>\n',
    'type': 'number | undefined'
  },
  {
    'name': 'totalSteps',
    'description': '<p>步骤总数</p>\n',
    'type': 'number'
  },
  {
    'name': 'isNextDisabled',
    'description': '<p>是否禁用下一步</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isPrevDisabled',
    'description': '<p>是否禁用上一步</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isFirstStep',
    'description': '<p>第一步是否激活</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isLastStep',
    'description': '<p>最后一步是否激活</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'goToStep',
    'description': '<p>转到特定步骤</p>\n',
    'type': ''
  },
  {
    'name': 'nextStep',
    'description': '<p>下一步</p>\n',
    'type': ''
  },
  {
    'name': 'prevStep',
    'description': '<p>上一步</p>\n',
    'type': ''
  }
]" />
