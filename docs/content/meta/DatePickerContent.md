<!-- This file was automatic generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'align',
    'description': '<p>The preferred alignment against the trigger.\nMay change when collisions occur.</p>\n',
    'type': '\'start\' | \'center\' | \'end\'',
    'required': false
  },
  {
    'name': 'alignFlip',
    'description': '<p>Flip alignment when colliding with boundary.\nMay only occur when <code>prioritizePosition</code> is true.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'alignOffset',
    'description': '<p>An offset in pixels from the <code>start</code> or <code>end</code> alignment options.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'arrowPadding',
    'description': '<p>The padding between the arrow and the edges of the content.\nIf your content has border-radius, this will prevent it from\noverflowing the corners.</p>\n',
    'type': 'number',
    'required': false
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
    'name': 'avoidCollisions',
    'description': '<p>When <code>true</code>, overrides the side and align preferences\nto prevent collisions with boundary edges.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'collisionBoundary',
    'description': '<p>The element used as the collision boundary. By default\nthis is the viewport, though you can provide additional\nelement(s) to be included in this check.</p>\n',
    'type': 'Element | (Element | null)[] | null',
    'required': false
  },
  {
    'name': 'collisionPadding',
    'description': '<p>The distance in pixels from the boundary edges where collision\ndetection should occur. Accepts a number (same for all sides),\nor a partial padding object, for example: { top: 20, left: 20 }.</p>\n',
    'type': 'number | Partial<Record<\'top\' | \'right\' | \'bottom\' | \'left\', number>>',
    'required': false
  },
  {
    'name': 'disableOutsidePointerEvents',
    'description': '<p>When <code>true</code>, hover/focus/click interactions will be disabled on elements outside\nthe <code>DismissableLayer</code>. Users will need to click twice on outside elements to\ninteract with them: once to close the <code>DismissableLayer</code>, and again to trigger the element.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disableUpdateOnLayoutShift',
    'description': '<p>Whether to disable the update position for the content when the layout shifted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'forceMount',
    'description': '<p>Used to force mounting when more control is needed. Useful when\ncontrolling animation with Vue animation libraries.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hideWhenDetached',
    'description': '<p>Whether to hide the content when the trigger becomes fully occluded.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'portal',
    'description': '<p>Props to control the portal wrapped around the content.</p>\n',
    'type': 'PopoverPortalProps',
    'required': false
  },
  {
    'name': 'positionStrategy',
    'description': '<p>The type of CSS position property to use.</p>\n',
    'type': '\'fixed\' | \'absolute\'',
    'required': false
  },
  {
    'name': 'prioritizePosition',
    'description': '<p>Force content to be position within the viewport.</p>\n<p>Might overlap the reference element, which may not be desired.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'reference',
    'description': '<p>The custom element or virtual element that will be set as the reference\nto position the floating element.</p>\n<p>If provided, it will replace the default anchor element.</p>\n',
    'type': 'ReferenceElement',
    'required': false
  },
  {
    'name': 'side',
    'description': '<p>The preferred side of the trigger to render against when open.\nWill be reversed when collisions occur and avoidCollisions\nis enabled.</p>\n',
    'type': '\'top\' | \'right\' | \'bottom\' | \'left\'',
    'required': false
  },
  {
    'name': 'sideFlip',
    'description': '<p>Flip to the opposite side when colliding with boundary.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'sideOffset',
    'description': '<p>The distance in pixels from the trigger.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'sticky',
    'description': '<p>The sticky behavior on the align axis. <code>partial</code> will keep the\ncontent in the boundary as long as the trigger is at least partially\nin the boundary whilst &quot;always&quot; will keep the content in the boundary\nregardless.</p>\n',
    'type': '\'partial\' | \'always\'',
    'required': false
  },
  {
    'name': 'updatePositionStrategy',
    'description': '<p>Strategy to update the position of the floating element on every animation frame.</p>\n',
    'type': '\'always\' | \'optimized\'',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'closeAutoFocus',
    'description': '<p>Event handler called when auto-focusing on close.\nCan be prevented.</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'escapeKeyDown',
    'description': '<p>Event handler called when the escape key is down.\nCan be prevented.</p>\n',
    'type': '[event: KeyboardEvent]'
  },
  {
    'name': 'focusOutside',
    'description': '<p>Event handler called when the focus moves outside of the <code>DismissableLayer</code>.\nCan be prevented.</p>\n',
    'type': '[event: FocusOutsideEvent]'
  },
  {
    'name': 'interactOutside',
    'description': '<p>Event handler called when an interaction happens outside the <code>DismissableLayer</code>.\nSpecifically, when a <code>pointerdown</code> event happens outside or focus moves outside of it.\nCan be prevented.</p>\n',
    'type': '[event: PointerDownOutsideEvent | FocusOutsideEvent]'
  },
  {
    'name': 'openAutoFocus',
    'description': '<p>Event handler called when auto-focusing on open.\nCan be prevented.</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'pointerDownOutside',
    'description': '<p>Event handler called when a <code>pointerdown</code> event happens outside of the <code>DismissableLayer</code>.\nCan be prevented.</p>\n',
    'type': '[event: PointerDownOutsideEvent]'
  }
]" />
