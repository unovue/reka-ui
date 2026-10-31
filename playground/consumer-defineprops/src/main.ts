import { createApp, h } from 'vue'
import AutocompleteConsumer from './AutocompleteConsumer.vue'
import DrawerConsumer from './DrawerConsumer.vue'

createApp({
  render: () => h('div', [h(AutocompleteConsumer), h(DrawerConsumer)]),
}).mount('#app')
