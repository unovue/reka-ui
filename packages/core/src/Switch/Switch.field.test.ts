import { h } from 'vue'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { SwitchRoot } from '.'

describeFieldControlContract({
  name: 'Switch',
  render: props => h(SwitchRoot, props),
  control: wrapper => wrapper.find('[role="switch"]').element as HTMLElement,
  interact: wrapper => wrapper.find('[role="switch"]').trigger('click'),
  interactedValue: true,
  emptyValue: false,
  filledValue: true,
})
