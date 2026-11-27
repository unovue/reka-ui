<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the drawer when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'defaultSnapPoint',
    'description': '<p>The snap point that is active when the drawer is initially rendered. Use when you do not need to control the active snap point.</p>\n',
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
    'description': '<p>The controlled open state of the drawer. Can be bound as <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'snapPoint',
    'description': '<p>The controlled active snap point. Can be bound as <code>v-model:snapPoint</code>.</p>\n',
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
    'type': '[value: boolean, details: DrawerOpenChangeDetails]'
  },
  {
    'name': 'update:openComplete',
    'description': '<p>Emitted with <code>true</code> once the drawer has finished opening and <code>false</code> once it has finished closing:\nwhen the animations and transitions running on the popup have ended, or when its content unmounts.\nAnimations that never end are not waited for.</p>\n',
    'type': '[value: boolean]'
  },
  {
    'name': 'update:snapPoint',
    'description': '<p>Event handler called when the active snap point changes.</p>\n',
    'type': '[value: DrawerSnapPoint | null]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>Current open state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'close',
    'description': '<p>Close the drawer</p>\n',
    'type': '(): void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` | The open state of the drawer when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | `false` |
| `defaultSnapPoint` | The snap point that is active when the drawer is initially rendered. Use when you do not need to control the active snap point. | `null \| string \| number` | No | - |
| `modal` | Modality of the drawer.  true (default): modal with focus trap, scroll lock, and outside-press dismiss 'trap-focus': traps focus but allows outside pointer events (non-modal side panels) false: non-modal | `false \| true \| "trap-focus"` | No | `true` |
| `open` | The controlled open state of the drawer. Can be bound as v-model:open. | `boolean` | No | - |
| `snapPoint` | The controlled active snap point. Can be bound as v-model:snapPoint. | `null \| string \| number` | No | - |
| `snapPoints` | Preset snap positions (fractions 0-1, pixels >1, or '148px'/'30rem' strings) | `DrawerSnapPoint[]` | No | - |
| `snapToSequentialPoints` | When true, snaps to the next sequential snap point (one step at a time). When false, snaps to the nearest snap point by distance. | `boolean` | No | `false` |
| `swipeDirection` | Direction to swipe to dismiss. | `"right" \| "left" \| "down" \| "up"` | No | `"down"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:open` | Event handler called when the open state of the dialog changes. | `[value: boolean, details: DrawerOpenChangeDetails]` |
| `update:openComplete` | Emitted with true once the drawer has finished opening and false once it has finished closing: when the animations and transitions running on the popup have ended, or when its content unmounts. Animations that never end are not waited for. | `[value: boolean]` |
| `update:snapPoint` | Event handler called when the active snap point changes. | `[value: DrawerSnapPoint \| null]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `close` | Close the drawer | `(): void` |

</llm-only>
