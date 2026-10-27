<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'estimateSize',
    'description': '<p>Estimated size (in px) of each item. A function receives the row index (group header rows included).</p>\n',
    'type': 'number | ((index: number) =&gt; number)',
    'required': false
  },
  {
    'name': 'options',
    'description': '<p>List of items, or groups of items (<code>{ label, options, disabled? }</code>). Groups\nare flattened to rows: a header row rendered by the <code>group</code> slot, then the\ngroup\'s options. Each option is the value of the item the default slot renders.</p>\n',
    'type': 'T[] | VirtualGroup&lt;T&gt;[]',
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
    'description': '<p>Text content for each item, used by typeahead, by the label registry and by a <code>ListboxRoot</code> <code>filter</code> (which otherwise matches the option\'s string form)</p>\n',
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
| `estimateSize` | Estimated size (in px) of each item. A function receives the row index (group header rows included). | `number \| ((index: number) => number)` | No | - |
| `options` | List of items, or groups of items ({ label, options, disabled? }). Groups are flattened to rows: a header row rendered by the group slot, then the group's options. Each option is the value of the item the default slot renders. | `T[] \| VirtualGroup<T>[]` | Yes | - |
| `overscan` | Number of items rendered outside the visible area | `number` | No | - |
| `textContent` | Text content for each item, used by typeahead, by the label registry and by a ListboxRoot filter (which otherwise matches the option's string form) | `((option: T) => string)` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `option` |  | `T` |
| `virtualizer` |  | `Virtualizer<HTMLElement, Element>` |
| `virtualItem` |  | `VirtualItem` |

</llm-only>
