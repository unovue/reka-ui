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
    'name': 'defaultOpen',
    'description': '<p>弹出面板最初呈现时的打开状态。在不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'defaultPlaceholder',
    'description': '<p>默认占位日期</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>日历的默认值</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>日期字段的读取方向（如果适用）。<br>如果省略，则从<code>ConfigProvider</code>全局继承或采用LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>是否禁用日期字段</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'fixedWeeks',
    'description': '<p>是否始终在日历中显示 6 周</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'granularity',
    'description': '<p>用于格式化时间的颗粒度。如果提供了CalendarDate，则默认为天，否则默认为分钟。该字段将为日期的每个部分截至指定颗粒度的片段并渲染</p>\n',
    'type': '\'day\' | \'hour\' | \'minute\' | \'second\'',
    'required': false
  },
  {
    'name': 'hideTimeZone',
    'description': '<p>是否隐藏字段的时区段</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hourCycle',
    'description': '<p>用于格式化时间的小时周期。默认为本地首选项</p>\n',
    'type': '12 | 24',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>元素的 id</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'isDateDisabled',
    'description': '<p>一个返回日期是否被禁用的函数</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'isDateUnavailable',
    'description': '<p>一个返回日期是否不可用的函数</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'locale',
    'description': '<p>用于设置日期格式的区域设置</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'en\''
  },
  {
    'name': 'maxValue',
    'description': '<p>可以选择的最大日期</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'minValue',
    'description': '<p>可以选择的最小日期</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'modal',
    'description': '<p>弹出框的模式。如果设置为 true，则将禁用与外部元素的交互，并且只有弹出面板内容对屏幕阅读器可见。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modelValue',
    'description': '<p>日历的受控选中状态。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'DateValue | null',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>字段的名称。作为其拥有表单作为名称/值对的一部分提交。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'numberOfMonths',
    'description': '<p>一次显示的月数</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'open',
    'description': '<p>弹出框的受控打开状态。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'pagedNavigation',
    'description': '<p>此属性使 previous 和 next 按钮按一次显示的月数（而不是一个月）导航</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'placeholder',
    'description': '<p>占位日期，用于确定在未选择日期时显示的月份。这会在用户导航日历时更新，并可用于以程序方式控制日历视图</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'preventDeselect',
    'description': '<p>是否阻止用户在未先选择其他日期的情况下取消选择日期</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'readonly',
    'description': '<p>日期字段是否为只读字段</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'required',
    'description': '<p>如果<code>true</code>，则表示用户必须先设置值，然后所属表单才能提交。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'weekdayFormat',
    'description': '<p>用于通过 weekdays slot 属性提供的工作日字符串的格式</p>\n',
    'type': '\'long\' | \'short\' | \'narrow\'',
    'required': false,
    'default': '\'narrow\''
  },
  {
    'name': 'weekStartsOn',
    'description': '<p>日历开始于星期几</p>\n',
    'type': '0 | 1 | 2 | 3 | 4 | 5 | 6',
    'required': false,
    'default': '0'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>每当值更改时调用的事件处理程序</p>\n',
    'type': '[date: DateValue]'
  },
  {
    'name': 'update:open',
    'description': '<p>子菜单的打开状态更改时调用的事件处理程序。</p>\n',
    'type': '[value: boolean]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>每当占位值更改时调用事件处理程序</p>\n',
    'type': '[date: DateValue]'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'isDateDisabled',
    'description': '<p>一个返回日期是否被禁用的函数</p>\n',
    'type': 'Matcher'
  },
  {
    'name': 'isDateUnavailable',
    'description': '<p>一个返回日期是否不可用的函数</p>\n',
    'type': 'Matcher'
  }
]" />
