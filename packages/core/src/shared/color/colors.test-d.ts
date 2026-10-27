import type { UseColorAreaReturn } from '@/ColorArea'
import type { UseColorFieldReturn } from '@/ColorField'
import type { UseColorSliderReturn } from '@/ColorSlider'
import type { UseColorSwatchReturn } from '@/ColorSwatch'
import type { UseColorSwatchPickerReturn } from '@/ColorSwatchPicker'

// Compile-only assertions: all writes must go through the composable's actions.
function readonlyColorState(area: UseColorAreaReturn, field: UseColorFieldReturn, slider: UseColorSliderReturn, swatch: UseColorSwatchReturn, picker: UseColorSwatchPickerReturn) {
  // @ts-expect-error Channel values are observations, not writable models.
  area.xValue.value = 10
  // @ts-expect-error Register the element through setThumbElement.
  area.thumbRef.value = undefined
  // @ts-expect-error The public context must not reopen direct writes.
  area.context.xValue.value = 10
  // @ts-expect-error Draft input changes go through updateValue.
  field.inputValue.value = '10'
  // @ts-expect-error Slider state is read-only.
  slider.channelValue.value = 10
  // @ts-expect-error Swatch color objects are read-only.
  swatch.color.value!.alpha = 0
  // @ts-expect-error Picker changes go through setValue/select.
  picker.modelValue.value = '#000000'
}
void readonlyColorState
