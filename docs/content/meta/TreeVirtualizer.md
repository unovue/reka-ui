<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'estimateSize',
    'description': '<p>Estimated size (in px) of each item</p>\n',
    'type': 'number | ((index: number) =&gt; number)',
    'required': false
  },
  {
    'name': 'overscan',
    'description': '<p>Number of items rendered outside the visible area</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'textContent',
    'description': '<p>Text content for each item to achieve type-ahead feature</p>\n',
    'type': '((item: Record&lt;string, any&gt;) =&gt; string)',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'item',
    'description': '',
    'type': 'FlattenedItem&lt;Record&lt;string, any&gt;&gt;'
  },
  {
    'name': 'virtualizer',
    'description': '',
    'type': 'Virtualizer&lt;Element | Window, Element&gt;'
  },
  {
    'name': 'virtualItem',
    'description': '',
    'type': 'VirtualItem'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `estimateSize` | Estimated size (in px) of each item | `number \| ((index: number) => number)` | No | - |
| `overscan` | Number of items rendered outside the visible area | `number` | No | - |
| `textContent` | Text content for each item to achieve type-ahead feature | `((item: Record<string, any>) => string)` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `item` |  | `FlattenedItem<Record<string, any>>` |
| `virtualizer` |  | `Virtualizer<Element \| Window, Element>` |
| `virtualItem` |  | `VirtualItem` |

</llm-only>
