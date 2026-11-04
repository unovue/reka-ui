import { h } from 'vue'
import { describeFieldControlContract, providedContext } from '@/test/fieldControlContract'
import { SwitchRoot } from '.'

describeFieldControlContract({
  name: 'Switch',
  setProgrammatically: wrapper => providedContext(wrapper, SwitchRoot, 'toggleCheck').toggleCheck(),
  render: props => h(SwitchRoot, props),
  control: wrapper => wrapper.find('[role="switch"]').element as HTMLElement,
  interact: wrapper => wrapper.find('[role="switch"]').trigger('click'),
  interactedValue: true,
  emptyValue: false,
  filledValue: true,
})
