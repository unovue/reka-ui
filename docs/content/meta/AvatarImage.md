<!-- This file was automatic generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'img\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'crossOrigin',
    'description': '',
    'type': '\'\' | \'anonymous\' | \'use-credentials\'',
    'required': false
  },
  {
    'name': 'referrerPolicy',
    'description': '',
    'type': '\'\' | \'no-referrer\' | \'no-referrer-when-downgrade\' | \'origin\' | \'origin-when-cross-origin\' | \'same-origin\' | \'strict-origin\' | \'strict-origin-when-cross-origin\' | \'unsafe-url\'',
    'required': false
  },
  {
    'name': 'src',
    'description': '',
    'type': 'string',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'loadingStatusChange',
    'description': '<p>A callback providing information about the loading status of the image. &lt;br&gt;\nThis is useful in case you want to control more precisely what to render as the image is loading.</p>\n',
    'type': '[value: ImageLoadingStatus]'
  }
]" />
