<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'align',
    'description': '<p>Where a snap places its slides in the viewport.</p>\n',
    'type': '\'start\' | \'center\' | \'end\'',
    'required': false,
    'default': '\'start\''
  },
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'div\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'autoHeight',
    'description': '<p>When <code>true</code>, the viewport takes the height of the current slides. Horizontal only.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'autoplay',
    'description': '<p>Advance to the next snap on an interval. Pauses on hover, stops when keyboard focus enters the carousel.</p>\n',
    'type': 'boolean | CarouselAutoplayOptions',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'autoScroll',
    'description': '<p>Scroll the track continuously. Pauses on hover, stops when keyboard focus enters the carousel.</p>\n',
    'type': 'boolean | CarouselAutoScrollOptions',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'containScroll',
    'description': '<p>How the snaps at the ends of the track are handled. <code>\'trimSnaps\'</code> merges the snaps that would leave empty space,\n<code>\'keepSnaps\'</code> keeps one snap per group, <code>false</code> adds empty space so every snap can be aligned. Ignored with <code>loop</code>.</p>\n',
    'type': 'false | \'trimSnaps\' | \'keepSnaps\'',
    'required': false,
    'default': '\'trimSnaps\''
  },
  {
    'name': 'defaultPlaying',
    'description': '<p>The rotation state when initially rendered. Rotation stops on mount when the user prefers reduced motion.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'defaultValue',
    'description': '<p>The index of the snap to show when initially rendered. Use when you do not need to control the index.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the carousel. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'dragFree',
    'description': '<p>When <code>true</code>, the track scrolls freely with momentum instead of resting on a snap.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'draggable',
    'description': '<p>When <code>false</code>, the track can\'t be dragged, swiped or scrolled by the user; the controls still navigate.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'fade',
    'description': '<p>When <code>true</code>, slides are stacked and cross-fade instead of sliding. Set the <code>transition</code> on the items yourself.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'inViewThreshold',
    'description': '<p>The fraction (0 to 1) of an item that has to be visible for it to count as in view.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'itemCount',
    'description': '<p>The number of slides. Only needed on the server, to render <code>snapCount</code>, the indicators, the enabled\nPrevious/Next and the slide labels before hydration: the slides register once mounted, and their count wins from then on.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'loop',
    'description': '<p>When <code>true</code>, the last slide is followed by the first one, and vice versa. Falls back to <code>false</code> when the slides are too few to wrap.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled index of the current snap. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>The axis the slides are laid out and scroll along.</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  },
  {
    'name': 'playing',
    'description': '<p>The controlled rotation state of <code>autoplay</code> or <code>autoScroll</code>. Can be bound as <code>v-model:playing</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'skipSnaps',
    'description': '<p>When <code>true</code>, a fast gesture can move past several snaps. When <code>false</code>, one gesture moves one snap.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'slidesToScroll',
    'description': '<p>How many slides one navigation step moves. <code>\'auto\'</code> moves as many as fit in the viewport.</p>\n',
    'type': 'number | \'auto\'',
    'required': false,
    'default': '1'
  },
  {
    'name': 'wheel',
    'description': '<p>When <code>true</code>, a mouse wheel pages through the snaps, and in <code>fade</code> mode the wheel and trackpad do too.</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the current snap changes.</p>\n',
    'type': '[value: number]'
  },
  {
    'name': 'update:playing',
    'description': '<p>Event handler called when rotation starts or stops.</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>The current snap index</p>\n',
    'type': 'number'
  },
  {
    'name': 'snapCount',
    'description': '<p>The number of snaps</p>\n',
    'type': 'number'
  },
  {
    'name': 'canScrollPrev',
    'description': '<p>Whether there is a snap before the current one</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'canScrollNext',
    'description': '<p>Whether there is a snap after the current one</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'scrollPrev',
    'description': '<p>Go to the previous snap</p>\n',
    'type': '(): boolean'
  },
  {
    'name': 'scrollNext',
    'description': '<p>Go to the next snap</p>\n',
    'type': '(): boolean'
  },
  {
    'name': 'scrollTo',
    'description': '<p>Go to the snap at <code>index</code></p>\n',
    'type': '(index: number): boolean'
  },
  {
    'name': 'playing',
    'description': '<p>Whether <code>autoplay</code> or <code>autoScroll</code> is rotating</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'play',
    'description': '<p>Start rotation</p>\n',
    'type': '(): boolean'
  },
  {
    'name': 'stop',
    'description': '<p>Stop rotation</p>\n',
    'type': '(): boolean'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `align` | Where a snap places its slides in the viewport. | `"start" \| "center" \| "end"` | No | `"start"` |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `autoHeight` | When true, the viewport takes the height of the current slides. Horizontal only. | `boolean` | No | - |
| `autoplay` | Advance to the next snap on an interval. Pauses on hover, stops when keyboard focus enters the carousel. | `boolean \| CarouselAutoplayOptions` | No | `false` |
| `autoScroll` | Scroll the track continuously. Pauses on hover, stops when keyboard focus enters the carousel. | `boolean \| CarouselAutoScrollOptions` | No | `false` |
| `containScroll` | How the snaps at the ends of the track are handled. 'trimSnaps' merges the snaps that would leave empty space, 'keepSnaps' keeps one snap per group, false adds empty space so every snap can be aligned. Ignored with loop. | `false \| "trimSnaps" \| "keepSnaps"` | No | `"trimSnaps"` |
| `defaultPlaying` | The rotation state when initially rendered. Rotation stops on mount when the user prefers reduced motion. | `boolean` | No | `true` |
| `defaultValue` | The index of the snap to show when initially rendered. Use when you do not need to control the index. | `number` | No | - |
| `dir` | The reading direction of the carousel. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `dragFree` | When true, the track scrolls freely with momentum instead of resting on a snap. | `boolean` | No | - |
| `draggable` | When false, the track can't be dragged, swiped or scrolled by the user; the controls still navigate. | `boolean` | No | `true` |
| `fade` | When true, slides are stacked and cross-fade instead of sliding. Set the transition on the items yourself. | `boolean` | No | - |
| `inViewThreshold` | The fraction (0 to 1) of an item that has to be visible for it to count as in view. | `number` | No | `0` |
| `itemCount` | The number of slides. Only needed on the server, to render snapCount, the indicators, the enabled Previous/Next and the slide labels before hydration: the slides register once mounted, and their count wins from then on. | `number` | No | - |
| `loop` | When true, the last slide is followed by the first one, and vice versa. Falls back to false when the slides are too few to wrap. | `boolean` | No | - |
| `modelValue` | The controlled index of the current snap. Can be bound as v-model. | `number` | No | - |
| `orientation` | The axis the slides are laid out and scroll along. | `"vertical" \| "horizontal"` | No | `"horizontal"` |
| `playing` | The controlled rotation state of autoplay or autoScroll. Can be bound as v-model:playing. | `boolean` | No | - |
| `skipSnaps` | When true, a fast gesture can move past several snaps. When false, one gesture moves one snap. | `boolean` | No | - |
| `slidesToScroll` | How many slides one navigation step moves. 'auto' moves as many as fit in the viewport. | `number \| "auto"` | No | `1` |
| `wheel` | When true, a mouse wheel pages through the snaps, and in fade mode the wheel and trackpad do too. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when the current snap changes. | `[value: number]` |
| `update:playing` | Event handler called when rotation starts or stops. | `[value: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | The current snap index | `number` |
| `snapCount` | The number of snaps | `number` |
| `canScrollPrev` | Whether there is a snap before the current one | `boolean` |
| `canScrollNext` | Whether there is a snap after the current one | `boolean` |
| `scrollPrev` | Go to the previous snap | `(): boolean` |
| `scrollNext` | Go to the next snap | `(): boolean` |
| `scrollTo` | Go to the snap at index | `(index: number): boolean` |
| `playing` | Whether autoplay or autoScroll is rotating | `boolean` |
| `play` | Start rotation | `(): boolean` |
| `stop` | Stop rotation | `(): boolean` |

</llm-only>
