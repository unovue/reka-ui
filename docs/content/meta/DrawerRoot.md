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
    'name': 'beforeUpdate:open',
    'description': '<p>Called before the open state changes (Base UI <code>onOpenChange</code>); <code>details.cancel()</code> keeps the current state.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;DrawerOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'beforeUpdate:snapPoint',
    'description': '<p>Called before the active snap point changes (Base UI <code>onSnapPointChange</code>); <code>details.cancel()</code> keeps the current\nsnap point. Cancelling the <code>null</code> a swipe past the last snap point requests keeps the drawer open.</p>\n',
    'type': '[value: DrawerSnapPoint | null, details: ChangeEventDetails&lt;DrawerOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:open',
    'description': '<p>Called when the open state changed.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;DrawerOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:openComplete',
    'description': '<p>Called once the popup\'s open (<code>true</code>) or close (<code>false</code>) transitions and animations have finished; on close, right\nbefore the popup unmounts. Infinite and cancelled animations are not waited for, and with none running it fires\nwithout waiting. A newer open change supersedes a pending one.</p>\n',
    'type': '[value: boolean]'
  },
  {
    'name': 'update:snapPoint',
    'description': '<p>Called when the active snap point changed.</p>\n',
    'type': '[value: DrawerSnapPoint | null, details: ChangeEventDetails&lt;DrawerOpenChangeReason, Event&gt;]'
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
| `modal` | Modality of the drawer.  `true` (default): modal with focus trap, scroll lock, and outside-press dismiss `'trap-focus'`: traps focus but allows outside pointer events (non-modal side panels) `false`: non-modal | `false \| true \| "trap-focus"` | No | `true` |
| `open` | v-model:open | `boolean` | No | - |
| `snapPoint` | v-model:snapPoint | `null \| string \| number` | No | - |
| `snapPoints` | Preset snap positions (fractions 0-1, pixels >1, or '148px'/'30rem' strings) | `DrawerSnapPoint[]` | No | - |
| `snapToSequentialPoints` | When true, snaps to the next sequential snap point (one step at a time). When false, snaps to the nearest snap point by distance. | `boolean` | No | `false` |
| `swipeDirection` | Direction to swipe to dismiss. | `"right" \| "left" \| "down" \| "up"` | No | `"down"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:open` | Called before the open state changes (Base UI `onOpenChange`); `details.cancel()` keeps the current state. | `[value: boolean, details: ChangeEventDetails<DrawerOpenChangeReason, Event>]` |
| `beforeUpdate:snapPoint` | Called before the active snap point changes (Base UI `onSnapPointChange`); `details.cancel()` keeps the current snap point. Cancelling the `null` a swipe past the last snap point requests keeps the drawer open. | `[value: DrawerSnapPoint \| null, details: ChangeEventDetails<DrawerOpenChangeReason, Event>]` |
| `update:open` | Called when the open state changed. | `[value: boolean, details: ChangeEventDetails<DrawerOpenChangeReason, Event>]` |
| `update:openComplete` | Called once the popup's open (`true`) or close (`false`) transitions and animations have finished; on close, right before the popup unmounts. Infinite and cancelled animations are not waited for, and with none running it fires without waiting. A newer open change supersedes a pending one. | `[value: boolean]` |
| `update:snapPoint` | Called when the active snap point changed. | `[value: DrawerSnapPoint \| null, details: ChangeEventDetails<DrawerOpenChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` |  | `boolean` |
| `close` |  | `(): void` |

</llm-only>
