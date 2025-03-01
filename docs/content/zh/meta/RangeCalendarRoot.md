<PropsTable :data="[
  {
    'name': 'allowNonContiguousRanges',
    'description': '<p>与 <code>isDateUnavailable</code>结合使用时，确定是否可以选择不连续的范围，即包含不可用日期的范围。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
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
    'name': 'calendarLabel',
    'description': '<p>日历的可访问标签</p>\n',
    'type': 'string',
    'required': false
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
    'type': 'DateRange',
    'required': false,
    'default': '{ start: undefined, end: undefined }'
  },
  {
    'name': 'dir',
    'description': '<p>日历的读取方向（如果适用）。<br>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>日历是否被禁用</p>\n',
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
    'name': 'initialFocus',
    'description': '<p>如果<code>true</code>，则日历将聚焦选定的日期、今天，或根据挂载日历时可见的这个月的第一天</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
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
    'required': false
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
    'name': 'modelValue',
    'description': '<p>日历的受控选中状态。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'DateRange | null',
    'required': false
  },
  {
    'name': 'nextPage',
    'description': '<p>返回日历下一页的函数。它接收当前占位作为组件内的参数。</p>\n',
    'type': '((placeholder: DateValue) => DateValue)',
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
    'name': 'prevPage',
    'description': '<p>返回日历上一页的函数。它接收当前占位作为组件内的参数。</p>\n',
    'type': '((placeholder: DateValue) => DateValue)',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>日历是否只读</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
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
    'type': '[date: DateRange]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>每当占位值更改时调用事件处理程序</p>\n',
    'type': '[date: DateValue]'
  },
  {
    'name': 'update:startValue',
    'description': '<p>当起始值更改时调用的事件处理程序</p>\n',
    'type': '[date: DateValue]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'date',
    'description': '<p>占位的当前日期</p>\n',
    'type': 'DateValue'
  },
  {
    'name': 'grid',
    'description': '<p>日期网格</p>\n',
    'type': 'Grid<DateValue>[]'
  },
  {
    'name': 'weekDays',
    'description': '<p>一周中的几天</p>\n',
    'type': 'string[]'
  },
  {
    'name': 'weekStartsOn',
    'description': '<p>本周的开始</p>\n',
    'type': '0 | 1 | 2 | 3 | 4 | 5 | 6'
  },
  {
    'name': 'locale',
    'description': '<p>日历区域</p>\n',
    'type': 'string'
  },
  {
    'name': 'fixedWeeks',
    'description': '<p>是否始终在日历中显示 6 周</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'modelValue',
    'description': '<p>当前日期范围</p>\n',
    'type': 'DateRange'
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
