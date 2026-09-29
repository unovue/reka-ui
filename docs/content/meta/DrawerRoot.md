<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'defaultSnapPoint',
    'description': '',
    'type': 'null | string | number',
    'required': false
  },
  {
    'name': 'modal',
    'description': '<p>Modality of the drawer.</p>\n<ul>\n<li><code>true</code> (default): modal with focus trap, scroll lock, and outside-press dismiss</li>\n<li><code>\'trap-focus\'</code>: traps focus but allows outside pointer events (non-modal side panels)</li>\n<li><code>false</code>: non-modal</li>\n</ul>\n',
    'type': 'false | true | \'trap-focus\'',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'open',
    'description': '<p>v-model:open</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'snapPoint',
    'description': '<p>v-model:snapPoint</p>\n',
    'type': 'null | string | number',
    'required': false
  },
  {
    'name': 'snapPoints',
    'description': '<p>Preset snap positions (fractions 0-1, pixels &gt;1, or \'148px\'/\'30rem\' strings)</p>\n',
    'type': 'DrawerSnapPoint[]',
    'required': false
  },
  {
    'name': 'snapToSequentialPoints',
    'description': '<p>When true, snaps to the next sequential snap point (one step at a time).\nWhen false, snaps to the nearest snap point by distance.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'swipeDirection',
    'description': '<p>Direction to swipe to dismiss.</p>\n',
    'type': '\'right\' | \'left\' | \'down\' | \'up\'',
    'required': false,
    'default': '\'down\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the dialog changes.</p>\n',
    'type': '[value: boolean, details?: DrawerOpenChangeDetails]'
  },
  {
    'name': 'update:openComplete',
    'description': '',
    'type': '[value: boolean]'
  },
  {
    'name': 'update:snapPoint',
    'description': '',
    'type': '[value: DrawerSnapPoint | null]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'close',
    'description': '',
    'type': '(): void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` |  | `boolean` | No | `false` |
| `defaultSnapPoint` |  | `null \| string \| number` | No | - |
| `modal` | Modality of the drawer.  true (default): modal with focus trap, scroll lock, and outside-press dismiss 'trap-focus': traps focus but allows outside pointer events (non-modal side panels) false: non-modal | `false \| true \| "trap-focus"` | No | `true` |
| `open` | v-model:open | `boolean` | No | - |
| `snapPoint` | v-model:snapPoint | `null \| string \| number` | No | - |
| `snapPoints` | Preset snap positions (fractions 0-1, pixels >1, or '148px'/'30rem' strings) | `DrawerSnapPoint[]` | No | - |
| `snapToSequentialPoints` | When true, snaps to the next sequential snap point (one step at a time). When false, snaps to the nearest snap point by distance. | `boolean` | No | `false` |
| `swipeDirection` | Direction to swipe to dismiss. | `"right" \| "left" \| "down" \| "up"` | No | `"down"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:open` | Event handler called when the open state of the dialog changes. | `[value: boolean, details?: DrawerOpenChangeDetails]` |
| `update:openComplete` |  | `[value: boolean]` |
| `update:snapPoint` |  | `[value: DrawerSnapPoint \| null]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` |  | `boolean` |
| `close` |  | `(): void` |

</llm-only>
