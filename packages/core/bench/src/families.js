// The family table: one entry per component family. Adding a family = adding an entry.
//
// Fixture (read by scripts/gen.mjs, which writes one <Family>.vue per run):
//   body     template for ONE instance; `i` is the instance index, `opts` / `tree` the data
//            (see data.js). reka-ui imports are derived from the tags used.
//   v2, v3   used instead of `body` when the two majors spell the composition differently
//   outer    [open, close] wrapped around all instances (shared providers)
//   script   extra <script setup> code
//   date     the fixture uses startDate / endDate / startTime (see scripts/build.mjs)
//   items    collection size of one instance in the census (default 5)
//
// Census (scenario `mount`, every family):
//   n        instances mounted per round
//   act      a representative interaction on one instance; popups open here
//   done     end state of `act` (default: the instance's HTML changed)
//   reset    undo `act`; timed as "close" for popups
//   popup    listed in the open/close table
//
// Large collections (scenario `collection`, families with a `collection` key): one instance
// with 1,000 / 5,000 items. See collection() in main.js for how each hook is used.
//   open     open the popup (popup families); `opened` is its end state
//   focus    put focus where the keyboard interaction starts
//   navKey   the key held down 50 times
//   marker   element that moves on every key press (highlight or focus)
//   type     type one typeahead / filter character; `typed` is its end state
//   select   select the given item; `selected` is its end state
import { $, $$, active, contextmenu, escape, focusKey, hover, key, press, typeInto, until } from './dom.js'

// Popup: open with `open(inst)`, done when `sel` is in the document, closed by Escape.
function overlay(open, sel, close = escape) {
  return {
    popup: true,
    act: open,
    done: () => !!$(sel),
    reset: async () => {
      await close()
      await until(() => !$(sel), `${sel} closed`)
    },
  }
}
function hoverOpen(i) {
  const t = $('.trg', i)
  hover(t, 'pointerenter')
  hover(t, 'pointermove')
}
async function hoverClose() {
  hover($('.trg', document), 'pointerleave')
  await escape()
}
const highlighted = root => $('[data-highlighted]', root)
const option = (root, k) => $$('[role="option"]', root)[k]

// v2 marks a pressed toggle with data-state="on", v3 with aria-pressed
const pressed = el => el.getAttribute('data-state') === 'on' || el.getAttribute('aria-pressed') === 'true'

function calendar(P) {
  const root = (gridAttr, cell) => `
<${P}Root v-slot="{ weekDays, grid }" :default-placeholder="startDate" locale="en-US">
  <${P}Header><${P}Prev>Prev</${P}Prev><${P}Heading /><${P}Next class="cal-next">Next</${P}Next></${P}Header>
  <${P}Grid v-for="month in grid" :key="month.value.toString()"${gridAttr}>
    <${P}GridHead><${P}GridRow><${P}HeadCell v-for="day in weekDays" :key="day">{{ day }}</${P}HeadCell></${P}GridRow></${P}GridHead>
    <${P}GridBody>
      <${P}GridRow v-for="(weekDates, index) in month.rows" :key="\`w-\${index}\`">
        <${P}Cell v-for="weekDate in weekDates" :key="weekDate.toString()" ${cell}</${P}Cell>
      </${P}GridRow>
    </${P}GridBody>
  </${P}Grid>
</${P}Root>`
  return {
    v2: root('', `:date="weekDate"><${P}CellTrigger :day="weekDate" :month="month.value" />`),
    v3: root(' :value="month.value"', `:value="weekDate"><${P}CellTrigger :value="weekDate" />`),
  }
}
// Month / year pickers (v2 only): one grid of 12 cells.
function unitPicker(P, unit) {
  return `
<${P}Root v-slot="{ grid }" :default-placeholder="startDate" locale="en-US">
  <${P}Header><${P}Prev>Prev</${P}Prev><${P}Heading /><${P}Next class="cal-next">Next</${P}Next></${P}Header>
  <${P}Grid>
    <${P}GridBody>
      <${P}GridRow v-for="(row, index) in grid.rows" :key="\`r-\${index}\`">
        <${P}Cell v-for="d in row" :key="d.toString()" :date="d"><${P}CellTrigger :${unit}="d" /></${P}Cell>
      </${P}GridRow>
    </${P}GridBody>
  </${P}Grid>
</${P}Root>`
}
function picker(P, range) {
  const inputs = range
    ? `<${P}Input v-for="item in segments.start" :key="\`s-\${item.part}\`" :part="item.part" type="start">{{ item.value }}</${P}Input>
    <${P}Input v-for="item in segments.end" :key="\`e-\${item.part}\`" :part="item.part" type="end">{{ item.value }}</${P}Input>`
    : `<${P}Input v-for="item in segments" :key="item.part" :part="item.part">{{ item.value }}</${P}Input>`
  const root = (gridAttr, cell) => `
<${P}Root locale="en-US" :default-placeholder="startDate">
  <${P}Field v-slot="{ segments }">
    ${inputs}
    <${P}Trigger class="trg">Open</${P}Trigger>
  </${P}Field>
  <${P}Content>
    <${P}Calendar v-slot="{ weekDays, grid }">
      <${P}Header><${P}Prev>Prev</${P}Prev><${P}Heading /><${P}Next>Next</${P}Next></${P}Header>
      <${P}Grid v-for="month in grid" :key="month.value.toString()"${gridAttr}>
        <${P}GridHead><${P}GridRow><${P}HeadCell v-for="day in weekDays" :key="day">{{ day }}</${P}HeadCell></${P}GridRow></${P}GridHead>
        <${P}GridBody>
          <${P}GridRow v-for="(weekDates, index) in month.rows" :key="\`w-\${index}\`">
            <${P}Cell v-for="weekDate in weekDates" :key="weekDate.toString()" ${cell}</${P}Cell>
          </${P}GridRow>
        </${P}GridBody>
      </${P}Grid>
    </${P}Calendar>
  </${P}Content>
</${P}Root>`
  return {
    v2: root('', `:date="weekDate"><${P}CellTrigger :day="weekDate" :month="month.value" />`),
    v3: root(' :value="month.value"', `:value="weekDate"><${P}CellTrigger :value="weekDate" />`),
  }
}
function drawer(overlay, content, grab) {
  return `
<DrawerRoot>
  <DrawerTrigger class="trg">Open</DrawerTrigger>
  <DrawerPortal>
    <${overlay} />
    <${content}>
      <${grab} />
      <DrawerTitle>Title</DrawerTitle>
      <DrawerDescription>Description</DrawerDescription>
      <DrawerClose>Close</DrawerClose>
    </${content}>
  </DrawerPortal>
</DrawerRoot>`
}
const daySegment = '[data-reka-date-field-segment="day"], [data-reka-date-field-segment]:not([data-reka-date-field-segment="literal"])'
const hourSegment = '[data-reka-time-field-segment="hour"], [data-reka-date-field-segment="hour"]'

// Shared by the families that move focus with the arrow keys (roving focus).
function roving(role, navKey = 'ArrowDown') {
  return {
    focus: root => $(`[role="${role}"]`, root).focus(),
    navKey,
    marker: active,
  }
}

export const FAMILIES = {
  Accordion: { n: 300, items: 3, act: i => press($('button', i)), body: `
<AccordionRoot type="single" collapsible>
  <AccordionItem v-for="o in opts" :key="o.value" :value="o.value">
    <AccordionHeader><AccordionTrigger>{{ o.label }}</AccordionTrigger></AccordionHeader>
    <AccordionContent>Body {{ o.label }}</AccordionContent>
  </AccordionItem>
</AccordionRoot>` },
  AlertDialog: { n: 100, ...overlay(i => press($('.trg', i)), '[role="alertdialog"]'), body: `
<AlertDialogRoot>
  <AlertDialogTrigger class="trg">Delete</AlertDialogTrigger>
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogContent>
      <AlertDialogTitle>Sure?</AlertDialogTitle>
      <AlertDialogDescription>Cannot be undone.</AlertDialogDescription>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>OK</AlertDialogAction>
    </AlertDialogContent>
  </AlertDialogPortal>
</AlertDialogRoot>` },
  AspectRatio: { n: 500, body: `<AspectRatio :ratio="16 / 9"><span>media</span></AspectRatio>` },
  Autocomplete: { n: 100, ...overlay(i => press($('.trg', i)), '[role="listbox"]'), body: `
<AutocompleteRoot>
  <AutocompleteAnchor>
    <AutocompleteInput placeholder="Fruit" />
    <AutocompleteTrigger class="trg">v</AutocompleteTrigger>
  </AutocompleteAnchor>
  <AutocompletePortal>
    <AutocompleteContent>
      <AutocompleteViewport>
        <AutocompleteItem v-for="o in opts" :key="o.value" :value="o.label">{{ o.label }}</AutocompleteItem>
      </AutocompleteViewport>
    </AutocompleteContent>
  </AutocompletePortal>
</AutocompleteRoot>` },
  Avatar: { n: 500, script: `const src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='`, body: `
<AvatarRoot><AvatarImage :src="src" alt="A" /><AvatarFallback>AB</AvatarFallback></AvatarRoot>` },
  Calendar: { n: 30, date: true, act: i => press($('.cal-next', i)), ...calendar('Calendar') },
  Carousel: { n: 100, act: i => press($('.car-next', i)), done: i => $('[data-active]', i) !== $('.car-dot', i), body: `
<CarouselRoot v-slot="{ snapCount }" aria-label="Featured" style="width: 300px">
  <CarouselViewport>
    <CarouselContent>
      <CarouselItem v-for="o in opts" :key="o.value" style="flex: 0 0 100%">{{ o.label }}</CarouselItem>
    </CarouselContent>
  </CarouselViewport>
  <CarouselPrevious>Prev</CarouselPrevious>
  <CarouselIndicator v-for="(_, index) in snapCount" :key="index" :index="index" class="car-dot" />
  <CarouselNext class="car-next">Next</CarouselNext>
</CarouselRoot>` },
  Checkbox: { n: 500, act: i => press($('button', i)), body: `<CheckboxRoot><CheckboxIndicator>✓</CheckboxIndicator></CheckboxRoot>` },
  CheckboxGroup: { n: 300, items: 3, act: i => press($('button', i)), body: `
<CheckboxGroupRoot :default-value="['v1']">
  <CheckboxRoot v-for="o in opts" :key="o.value" :value="o.value"><CheckboxIndicator>✓</CheckboxIndicator></CheckboxRoot>
</CheckboxGroupRoot>` },
  Collapsible: { n: 500, act: i => press($('button', i)), body: `
<CollapsibleRoot><CollapsibleTrigger>Toggle</CollapsibleTrigger><CollapsibleContent>Hidden body</CollapsibleContent></CollapsibleRoot>` },
  ColorArea: { n: 300, act: i => key($('[role="slider"]', i) ?? $('input', i), 'ArrowRight'), body: `
<ColorAreaRoot v-slot="{ style }" default-value="#3366cc"><ColorAreaArea :style="style" class="carea"><ColorAreaThumb /></ColorAreaArea></ColorAreaRoot>` },
  ColorField: { n: 500, act: i => focusKey($('input', i), 'ArrowUp'), body: `<ColorFieldRoot default-value="#3366cc"><ColorFieldInput /></ColorFieldRoot>` },
  ColorSlider: { n: 500, act: i => key($('[role="slider"]', i), 'ArrowRight'), body: `
<ColorSliderRoot default-value="#ff0000" channel="hue" color-space="hsl" class="cslider"><ColorSliderTrack /><ColorSliderThumb /></ColorSliderRoot>` },
  ColorSwatch: { n: 500, body: `<ColorSwatch color="#3366cc" />` },
  ColorSwatchPicker: { n: 200, act: i => press($$('[role="option"], [role="radio"]', i)[1]), script: `const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff']`, body: `
<ColorSwatchPickerRoot default-value="#ff0000" aria-label="Swatches">
  <ColorSwatchPickerItem v-for="c in colors" :key="c" :value="c"><ColorSwatchPickerItemSwatch /><ColorSwatchPickerItemIndicator /></ColorSwatchPickerItem>
</ColorSwatchPickerRoot>` },
  Combobox: {
    n: 100,
    ...overlay(i => press($('.trg', i)), '[role="listbox"]'),
    collection: {
      open: root => press($('.trg', root)),
      opened: () => !!$('[role="option"]'),
      focus: root => $('input', root).focus(),
      navKey: 'ArrowDown',
      marker: () => highlighted(document),
      // filter down to the options containing the character, then (untimed) back to all of them
      type: (root, ch) => typeInto($('input', root), ch),
      typed: (root, ch, before) => $$('[role="option"]').length !== before.options,
      untype: root => typeInto($('input', root), ''),
      select: (root, k) => press(option(document, k)),
      selected: () => !$('[role="listbox"]'),
    },
    body: `
<ComboboxRoot>
  <ComboboxAnchor>
    <ComboboxInput placeholder="Fruit" />
    <ComboboxTrigger class="trg">v</ComboboxTrigger>
  </ComboboxAnchor>
  <ComboboxPortal>
    <ComboboxContent class="big">
      <ComboboxViewport>
        <ComboboxEmpty>None</ComboboxEmpty>
        <ComboboxItem v-for="o in opts" :key="o.value" :value="o.label">{{ o.label }}<ComboboxItemIndicator>✓</ComboboxItemIndicator></ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</ComboboxRoot>`,
  },
  ContextMenu: { n: 100, ...overlay(i => contextmenu($('.trg', i)), '[role="menu"]'), body: `
<ContextMenuRoot>
  <ContextMenuTrigger class="trg">Right click</ContextMenuTrigger>
  <ContextMenuPortal>
    <ContextMenuContent>
      <ContextMenuItem v-for="o in opts" :key="o.value">{{ o.label }}</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenuPortal>
</ContextMenuRoot>` },
  DateField: { n: 200, date: true, act: i => focusKey($(daySegment, i), 'ArrowUp'), body: `
<DateFieldRoot v-slot="{ segments }" :default-value="startDate" locale="en-US">
  <DateFieldInput v-for="item in segments" :key="item.part" :part="item.part">{{ item.value }}</DateFieldInput>
</DateFieldRoot>` },
  DatePicker: { n: 100, date: true, ...overlay(i => press($('.trg', i)), '[role="dialog"]'), ...picker('DatePicker', false) },
  DateRangeField: { n: 100, date: true, act: i => focusKey($(daySegment, i), 'ArrowUp'), body: `
<DateRangeFieldRoot v-slot="{ segments }" :default-value="{ start: startDate, end: endDate }" locale="en-US">
  <DateRangeFieldInput v-for="item in segments.start" :key="\`s-\${item.part}\`" :part="item.part" type="start">{{ item.value }}</DateRangeFieldInput>
  <DateRangeFieldInput v-for="item in segments.end" :key="\`e-\${item.part}\`" :part="item.part" type="end">{{ item.value }}</DateRangeFieldInput>
</DateRangeFieldRoot>` },
  DateRangePicker: { n: 100, date: true, ...overlay(i => press($('.trg', i)), '[role="dialog"]'), ...picker('DateRangePicker', true) },
  Dialog: { n: 100, ...overlay(i => press($('.trg', i)), '[role="dialog"]'), body: `
<DialogRoot>
  <DialogTrigger class="trg">Edit</DialogTrigger>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Make changes.</DialogDescription>
      <DialogClose>Close</DialogClose>
    </DialogContent>
  </DialogPortal>
</DialogRoot>` },
  Drawer: { n: 100, ...overlay(i => press($('.trg', i)), '[role="dialog"]'), v2: drawer('DrawerOverlay', 'DrawerContent', 'DrawerHandle'), v3: drawer('DrawerBackdrop', 'DrawerPopup', 'DrawerGrabber') },
  DropdownMenu: {
    n: 100,
    ...overlay(i => press($('.trg', i)), '[role="menu"]'),
    collection: {
      open: root => press($('.trg', root)),
      opened: () => !!$('[role="menuitem"]'),
      focus: () => $('[role="menu"]').focus(),
      navKey: 'ArrowDown',
      marker: active,
      type: (root, ch) => key(active(), ch),
      select: (root, k) => press($$('[role="menuitem"]')[k]),
      selected: () => !$('[role="menu"]'),
    },
    body: `
<DropdownMenuRoot>
  <DropdownMenuTrigger class="trg">Menu</DropdownMenuTrigger>
  <DropdownMenuPortal>
    <DropdownMenuContent class="big">
      <DropdownMenuItem v-for="o in opts" :key="o.value">{{ o.label }}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuPortal>
</DropdownMenuRoot>`,
  },
  Editable: { n: 300, act: i => press($('.edit', i)), body: `
<EditableRoot default-value="Click to edit">
  <EditableArea><EditablePreview /><EditableInput /></EditableArea>
  <EditableEditTrigger class="edit">Edit</EditableEditTrigger>
  <EditableSubmitTrigger>Save</EditableSubmitTrigger>
  <EditableCancelTrigger>Cancel</EditableCancelTrigger>
</EditableRoot>` },
  Field: { n: 300, act: i => typeInto($('input', i), 'hello'), done: i => $('input', i).value === 'hello', body: `
<FieldRoot :name="\`f\${i}\`">
  <FieldLabel>Email</FieldLabel>
  <FieldControl type="email" />
  <FieldDescription>We never share it.</FieldDescription>
  <FieldError>Invalid</FieldError>
</FieldRoot>` },
  Form: { n: 200, act: i => typeInto($('input', i), 'hello'), done: i => $('input', i).value === 'hello', body: `
<FormRoot>
  <FieldRoot v-for="f in ['name', 'email', 'city']" :key="f" :name="f">
    <FieldLabel>{{ f }}</FieldLabel>
    <FieldControl />
    <FieldError>Invalid</FieldError>
  </FieldRoot>
</FormRoot>` },
  HoverCard: { n: 100, ...overlay(hoverOpen, '.hc-content', hoverClose), body: `
<HoverCardRoot :open-delay="0" :close-delay="0">
  <HoverCardTrigger class="trg" href="#">@user</HoverCardTrigger>
  <HoverCardPortal>
    <HoverCardContent class="hc-content">Profile<HoverCardArrow /></HoverCardContent>
  </HoverCardPortal>
</HoverCardRoot>` },
  Label: { n: 500, body: `<Label for="x">Name</Label>` },
  Listbox: {
    n: 300,
    act: i => press(option(i, 2)),
    collection: {
      focus: root => $('[role="listbox"]', root).focus(),
      navKey: 'ArrowDown',
      marker: highlighted,
      type: (root, ch) => key(active(), ch),
      select: (root, k) => press(option(root, k)),
      selected: (root, k) => option(root, k).getAttribute('aria-selected') === 'true',
    },
    body: `
<ListboxRoot>
  <ListboxContent class="big">
    <ListboxItem v-for="o in opts" :key="o.value" :value="o.value">{{ o.label }}<ListboxItemIndicator>✓</ListboxItemIndicator></ListboxItem>
  </ListboxContent>
</ListboxRoot>`,
  },
  Menubar: { n: 100, ...overlay(i => press($('.trg', i)), '[role="menu"]'), body: `
<MenubarRoot>
  <MenubarMenu v-for="m in ['File', 'Edit', 'View']" :key="m">
    <MenubarTrigger :class="{ trg: m === 'File' }">{{ m }}</MenubarTrigger>
    <MenubarPortal>
      <MenubarContent>
        <MenubarItem v-for="k in 3" :key="k">{{ m }} {{ k }}</MenubarItem>
      </MenubarContent>
    </MenubarPortal>
  </MenubarMenu>
</MenubarRoot>` },
  MonthPicker: { n: 50, date: true, act: i => press($('.cal-next', i)), body: unitPicker('MonthPicker', 'month') },
  MonthRangePicker: { n: 50, date: true, act: i => press($('.cal-next', i)), body: unitPicker('MonthRangePicker', 'month') },
  // Scoped to this instance's trigger: content from a previous instance may still be closing.
  NavigationMenu: {
    n: 100,
    act: i => press($('.trg', i)),
    done: i => $('.trg', i).getAttribute('aria-expanded') === 'true',
    reset: async (i) => {
      press($('.trg', i))
      await until(() => $('.trg', i).getAttribute('aria-expanded') === 'false', 'NavigationMenu closed')
    },
    body: `
<NavigationMenuRoot>
  <NavigationMenuList>
    <NavigationMenuItem v-for="m in ['Learn', 'Overview']" :key="m">
      <NavigationMenuTrigger :class="{ trg: m === 'Learn' }">{{ m }}</NavigationMenuTrigger>
      <NavigationMenuContent class="nm-content"><NavigationMenuLink href="#">{{ m }} link</NavigationMenuLink></NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem><NavigationMenuLink href="#">Github</NavigationMenuLink></NavigationMenuItem>
  </NavigationMenuList>
  <NavigationMenuViewport />
</NavigationMenuRoot>`,
  },
  NumberField: { n: 300, act: i => press($('.inc', i)), body: `
<NumberFieldRoot :default-value="5" locale="en-US"><NumberFieldDecrement>-</NumberFieldDecrement><NumberFieldInput /><NumberFieldIncrement class="inc">+</NumberFieldIncrement></NumberFieldRoot>` },
  Pagination: { n: 300, act: i => press($('.next', i)), body: `
<PaginationRoot :total="100" :items-per-page="10" :sibling-count="1" show-edges :default-page="2">
  <PaginationList v-slot="{ items: pages }">
    <PaginationFirst>«</PaginationFirst>
    <PaginationPrev>‹</PaginationPrev>
    <template v-for="(page, index) in pages">
      <PaginationListItem v-if="page.type === 'page'" :key="index" :value="page.value">{{ page.value }}</PaginationListItem>
      <PaginationEllipsis v-else :key="page.type" :index="index">…</PaginationEllipsis>
    </template>
    <PaginationNext class="next">›</PaginationNext>
    <PaginationLast>»</PaginationLast>
  </PaginationList>
</PaginationRoot>` },
  PinInput: { n: 300, act: i => typeInto($('input', i), '1'), done: i => $('input', i).value === '1', body: `<PinInputRoot><PinInputInput v-for="(id, index) in 4" :key="id" :index="index" /></PinInputRoot>` },
  Popover: { n: 100, ...overlay(i => press($('.trg', i)), '.pop-content'), body: `
<PopoverRoot>
  <PopoverTrigger class="trg">More</PopoverTrigger>
  <PopoverPortal>
    <PopoverContent class="pop-content">Settings<PopoverClose>x</PopoverClose><PopoverArrow /></PopoverContent>
  </PopoverPortal>
</PopoverRoot>` },
  Progress: { n: 500, body: `<ProgressRoot :model-value="40"><ProgressIndicator /></ProgressRoot>` },
  RadioGroup: {
    n: 300,
    items: 3,
    act: i => press($$('[role="radio"]', i)[1]),
    collection: {
      ...roving('radio'),
      select: (root, k) => press($$('[role="radio"]', root)[k]),
      selected: (root, k) => $$('[role="radio"]', root)[k].getAttribute('aria-checked') === 'true',
    },
    body: `
<RadioGroupRoot default-value="v0"><RadioGroupItem v-for="o in opts" :key="o.value" :value="o.value"><RadioGroupIndicator /></RadioGroupItem></RadioGroupRoot>`,
  },
  RangeCalendar: { n: 30, date: true, act: i => press($('.cal-next', i)), ...calendar('RangeCalendar') },
  Rating: { n: 300, act: i => press($$('[role="radio"]', i)[3]), body: `
<RatingRoot v-slot="{ items: stars }" :default-value="2">
  <RatingItem v-for="item in stars" :key="item" v-slot="{ steps }" :item="item">
    <RatingItemIndicator v-for="step in steps" :key="step" :step="step">★</RatingItemIndicator>
  </RatingItem>
</RatingRoot>` },
  ScrollArea: { n: 300, body: `
<ScrollAreaRoot class="sa" type="always">
  <ScrollAreaViewport class="sa-vp"><div v-for="k in 5" :key="k">Line {{ k }}</div></ScrollAreaViewport>
  <ScrollAreaScrollbar orientation="vertical"><ScrollAreaThumb /></ScrollAreaScrollbar>
  <ScrollAreaCorner />
</ScrollAreaRoot>` },
  Select: {
    n: 100,
    ...overlay(i => press($('.trg', i)), '[role="listbox"]'),
    collection: {
      open: root => press($('.trg', root)),
      opened: () => !!$('[role="option"]'),
      focus: () => {},
      navKey: 'ArrowDown',
      marker: active,
      type: (root, ch) => key(active(), ch),
      select: (root, k) => {
        const el = option(document, k)
        hover(el, 'pointermove')
        press(el)
      },
      selected: () => !$('[role="listbox"]'),
    },
    body: `
<SelectRoot>
  <SelectTrigger class="trg"><SelectValue placeholder="Pick" /><SelectIcon>v</SelectIcon></SelectTrigger>
  <SelectPortal>
    <SelectContent position="popper" class="big">
      <SelectViewport>
        <SelectItem v-for="o in opts" :key="o.value" :value="o.value"><SelectItemText>{{ o.label }}</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem>
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</SelectRoot>`,
  },
  Separator: { n: 500, body: `<Separator />` },
  Slider: { n: 500, act: i => key($('[role="slider"]', i), 'ArrowRight'), body: `
<SliderRoot :default-value="[50]" class="slider"><SliderTrack><SliderRange /></SliderTrack><SliderThumb /></SliderRoot>` },
  SliderArea: { n: 300, act: i => key($('[role="slider"]', i), 'ArrowRight'), body: `
<SliderAreaRoot :default-value="[[20, 30]]" class="sarea"><SliderAreaArea><SliderAreaRegion /></SliderAreaArea><SliderAreaThumb /></SliderAreaRoot>` },
  Splitter: { n: 300, act: i => key($('[role="separator"]', i), 'ArrowRight'), body: `
<SplitterGroup direction="horizontal" class="split"><SplitterPanel :default-size="50">A</SplitterPanel><SplitterResizeHandle /><SplitterPanel :default-size="50">B</SplitterPanel></SplitterGroup>` },
  Stepper: { n: 300, act: i => press($$('button', i)[1]), body: `
<StepperRoot :default-value="1">
  <StepperItem v-for="s in 3" :key="s" :step="s">
    <StepperTrigger><StepperIndicator>{{ s }}</StepperIndicator></StepperTrigger>
    <StepperTitle>Step {{ s }}</StepperTitle>
    <StepperDescription>Desc</StepperDescription>
    <StepperSeparator v-if="s !== 3" />
  </StepperItem>
</StepperRoot>` },
  Switch: { n: 500, act: i => press($('button', i)), body: `<SwitchRoot><SwitchThumb /></SwitchRoot>` },
  Tabs: {
    n: 300,
    items: 3,
    act: i => press($$('[role="tab"]', i)[1]),
    collection: {
      ...roving('tab', 'ArrowRight'),
      select: (root, k) => press($$('[role="tab"]', root)[k]),
      selected: (root, k) => $$('[role="tab"]', root)[k].getAttribute('aria-selected') === 'true',
    },
    body: `
<TabsRoot default-value="v0">
  <TabsList><TabsTrigger v-for="o in opts" :key="o.value" :value="o.value">{{ o.label }}</TabsTrigger></TabsList>
  <TabsContent v-for="o in opts" :key="o.value" :value="o.value">Panel {{ o.label }}</TabsContent>
</TabsRoot>`,
  },
  TagGroup: { n: 300, act: i => press($$('[role="row"], [role="option"]', i)[1]), body: `
<TagGroupRoot selection-mode="single" aria-label="Tags">
  <TagGroupItem v-for="t in ['News', 'Travel', 'Gaming']" :key="t" :value="t"><TagGroupItemText>{{ t }}</TagGroupItemText><TagGroupItemDelete>x</TagGroupItemDelete></TagGroupItem>
</TagGroupRoot>` },
  TagsInput: { n: 300, act: i => press($('.del', i)), body: `
<TagsInputRoot v-slot="{ modelValue }" :default-value="['Apple', 'Banana']">
  <TagsInputItem v-for="t in modelValue" :key="t" :value="t"><TagsInputItemText /><TagsInputItemDelete class="del">x</TagsInputItemDelete></TagsInputItem>
  <TagsInputInput placeholder="Add" />
</TagsInputRoot>` },
  TimeField: { n: 300, date: true, act: i => focusKey($(hourSegment, i), 'ArrowUp'), body: `
<TimeFieldRoot v-slot="{ segments }" :default-value="startTime" locale="en-US">
  <TimeFieldInput v-for="item in segments" :key="item.part" :part="item.part">{{ item.value }}</TimeFieldInput>
</TimeFieldRoot>` },
  TimeRangeField: { n: 100, date: true, act: i => focusKey($(hourSegment, i), 'ArrowUp'), body: `
<TimeRangeFieldRoot v-slot="{ segments }" :default-value="{ start: startTime, end: endTime }" locale="en-US">
  <TimeRangeFieldInput v-for="(item, index) in segments.start" :key="\`s-\${index}\`" :part="item.part" type="start">{{ item.value }}</TimeRangeFieldInput>
  <TimeRangeFieldInput v-for="(item, index) in segments.end" :key="\`e-\${index}\`" :part="item.part" type="end">{{ item.value }}</TimeRangeFieldInput>
</TimeRangeFieldRoot>` },
  // ToastRoot teleports into the shared viewport, so the instance wrapper is empty: close the first remaining toast.
  Toast: {
    n: 100,
    act: () => {
      window.__toasts = $$('.close').length
      press($('.close'))
    },
    done: () => $$('.close').length < window.__toasts,
    outer: ['<ToastProvider :duration="1000000000">', '<ToastViewport class="toast-vp" /></ToastProvider>'],
    body: `
<ToastRoot><ToastTitle>Saved</ToastTitle><ToastDescription>Changes saved.</ToastDescription><ToastClose class="close">x</ToastClose></ToastRoot>`,
  },
  Toggle: { n: 500, act: i => press($('button', i)), body: `<Toggle aria-label="Bold">B</Toggle>` },
  ToggleGroup: {
    n: 300,
    items: 3,
    act: i => press($$('button', i)[1]),
    collection: {
      focus: root => $('button', root).focus(),
      navKey: 'ArrowRight',
      marker: active,
      select: (root, k) => press($$('button', root)[k]),
      selected: (root, k) => pressed($$('button', root)[k]),
    },
    body: `
<ToggleGroupRoot type="single" default-value="v0"><ToggleGroupItem v-for="o in opts" :key="o.value" :value="o.value">{{ o.label }}</ToggleGroupItem></ToggleGroupRoot>`,
  },
  Toolbar: { n: 300, act: i => press($('.tt', i)), body: `
<ToolbarRoot>
  <ToolbarToggleGroup type="multiple"><ToolbarToggleItem value="b" class="tt">B</ToolbarToggleItem><ToolbarToggleItem value="i">I</ToolbarToggleItem></ToolbarToggleGroup>
  <ToolbarSeparator />
  <ToolbarLink href="#">Edited</ToolbarLink>
  <ToolbarButton>Share</ToolbarButton>
</ToolbarRoot>` },
  Tooltip: { n: 100, ...overlay(hoverOpen, '.tt-content', hoverClose), outer: ['<TooltipProvider :delay-duration="0" :skip-delay-duration="0">', '</TooltipProvider>'], body: `
<TooltipRoot>
  <TooltipTrigger class="trg">+</TooltipTrigger>
  <TooltipPortal><TooltipContent class="tt-content">Add<TooltipArrow /></TooltipContent></TooltipPortal>
</TooltipRoot>` },
  Tree: {
    n: 200,
    items: 6,
    act: i => press($$('[role="treeitem"]', i)[1]),
    collection: {
      ...roving('treeitem'),
      type: (root, ch) => key(active(), ch),
      select: (root, k) => press($$('[role="treeitem"]', root)[k]),
      selected: (root, k) => $$('[role="treeitem"]', root)[k].getAttribute('aria-selected') === 'true',
    },
    body: `
<TreeRoot v-slot="{ flattenItems }" :items="tree" :get-key="item => item.title" :default-expanded="expanded" class="big">
  <TreeItem v-for="item in flattenItems" :key="item._id" v-bind="item.bind">{{ item.value.title }}</TreeItem>
</TreeRoot>`,
  },
  YearPicker: { n: 50, date: true, act: i => press($('.cal-next', i)), body: unitPicker('YearPicker', 'year') },
  YearRangePicker: { n: 50, date: true, act: i => press($('.cal-next', i)), body: unitPicker('YearRangePicker', 'year') },

  // Reference rows: the cost of the wrapper layers themselves, not a component family.
  RefBaseline: { n: 500, ref: true, body: `<div>x</div>` },
  RefVueComponent: { n: 500, ref: true, locals: ['Plain'], script: `const Plain = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })`, body: `<Plain>x</Plain>` },
  RefPrimitive: { n: 500, ref: true, body: `<Primitive as="div">x</Primitive>` },
  RefPrimitiveAsChild: { n: 500, ref: true, body: `<Primitive as-child><div>x</div></Primitive>` },
}

export const COLLECTION_SIZES = [1000, 5000]
export const COLLECTION_FAMILIES = Object.keys(FAMILIES).filter(f => FAMILIES[f].collection)
export const POPUP_FAMILIES = Object.keys(FAMILIES).filter(f => FAMILIES[f].popup)
