<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'span\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'feature',
    'description': '<p>How the content is hidden.</p>\n<ul>\n<li><code>focusable</code> (default): hidden visually only. The content stays in the\naccessibility tree, so slotted text is announced and can label its\nparent, and it keeps whatever focusability it has.</li>\n<li><code>fully-hidden</code>: also removed from the accessibility tree\n(<code>aria-hidden=&quot;true&quot;</code>) and the tab order (<code>tabindex=&quot;-1&quot;</code>). Use for\nhidden form inputs.</li>\n</ul>\n',
    'type': '\'focusable\' | \'fully-hidden\'',
    'required': false,
    'default': '\'focusable\''
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"span"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `feature` | How the content is hidden.  focusable (default): hidden visually only. The content stays in the accessibility tree, so slotted text is announced and can label its parent, and it keeps whatever focusability it has. fully-hidden: also removed from the accessibility tree (aria-hidden="true") and the tab order (tabindex="-1"). Use for hidden form inputs. | `"focusable" \| "fully-hidden"` | No | `"focusable"` |

</llm-only>
