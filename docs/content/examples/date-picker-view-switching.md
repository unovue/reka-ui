---
title: Date Picker View Switching
tags:
  - Calendar
---

# Date Picker View Switching

<Description>

One Calendar with day, month and year views: click the heading to drill up, select a cell to drill back down.

</Description>

<Tags />

<ComponentPreview type="example" name="DatePickerViewSwitching" />

<ExampleSection>

### View Switching Pattern

`CalendarViewTrigger` renders the heading as a button that switches the root's `view` from `day` to `month` to `year`. Each `CalendarView` renders only while its view is active. Selecting a year moves the placeholder into that year and drops to the month view; selecting a month drops to the day view; selecting a day commits the value. Bind `v-model:view` to control or observe the active view, and `max-view` to stop the drill-up early.

</ExampleSection>
