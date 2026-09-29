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
    'name': 'options',
    'description': '<p>List of items</p>\n',
    'type': 'T',
    'required': true
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
    'type': '((option: T) =&gt; string)',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'option',
    'description': '',
    'type': 'T'
  },
  {
    'name': 'virtualizer',
    'description': '',
    'type': 'Virtualizer&lt;HTMLElement, Element&gt;'
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
| `options` | List of items | `T` | Yes | - |
| `overscan` | Number of items rendered outside the visible area | `number` | No | - |
| `textContent` | Text content for each item to achieve type-ahead feature | `((option: T) => string)` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `option` |  | `T` |
| `virtualizer` |  | `Virtualizer<HTMLElement, Element>` |
| `virtualItem` |  | `VirtualItem` |

</llm-only>
