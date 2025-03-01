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
    'description': '<p>日历的当前日期</p>\n',
    'type': 'CalendarDate | CalendarDateTime | ZonedDateTime'
  }
]" />
