# reka-ui bench

Browser benchmark for reka-ui: what every component family costs to mount and keep, what its
main interaction costs, and how the list families behave with 1,000 and 5,000 items.

It measures the **built** library (`packages/core/dist`, production mode) in headless Chromium
through Playwright. It lives outside `src`, so it is not published, and it has no `*.test.*`
files, so `pnpm test` does not pick it up. It uses the dev dependencies `packages/core` already has.

## Run

```bash
pnpm --filter reka-ui build              # the bench measures dist, so build first
pnpm bench                               # every family, ~25 min
pnpm bench --family Listbox              # one family (or a list: --family Listbox,Select)
pnpm bench --scenario collection         # only the 1,000 / 5,000 item scenarios
pnpm bench --gate 2 --out before.json    # wait for a quiet machine, keep the results
pnpm bench:compare before.json after.json
```

`pnpm bench --help` lists every option. The first run needs Chromium:
`pnpm --filter reka-ui exec playwright install chromium`.

A run writes `<out>` (JSON), the same name with `.md` (the tables below), and, last of all,
`<out>.done`. Scripts that wait for a run must wait for the `.done` file: the JSON existing does
not mean the run finished. Without `--out` the files go to `bench/dist/<label>.*` (git-ignored).

To measure another checkout (another branch in a worktree, built there), point `--lib` at its
`packages/core`. The fixtures are generated for the major version found there, and families
that build doesn't have are listed as "not in this build".

```bash
pnpm bench --lib ../other-worktree/packages/core --label other --out other.json
```

### Before and after a change

```bash
git stash            # or check out the base commit
pnpm --filter reka-ui build && pnpm bench --gate 2 --out /tmp/before.json
git stash pop
pnpm --filter reka-ui build && pnpm bench --gate 2 --out /tmp/after.json
pnpm bench:compare /tmp/before.json /tmp/after.json
```

Use `--family` to keep this to the families the change touches. Heap and the counts are
deterministic enough to compare from any two runs. Timings are only comparable between two runs
on the same quiet machine, back to back.

## What it measures

Every sample set is a fresh browser context, so a fresh renderer and heap. Events are dispatched
inside the page, so no timing includes Playwright's round trip. All timings are in milliseconds
and end after Vue's flush plus a forced style and layout pass. The "painted" variants add two
animation frames (frames are uncapped, so that is the real compositor work, not a 16 ms wait).

**Mount scenario, every family** (`bench/src/families.js`; N instances of a typical
composition, popups closed). After an untimed warm-up, each page load does `--rounds` rounds of
mount → GC → unmount → GC:

| Column | Meaning |
|---|---|
| mount ms | time to mount all N instances; `µs / inst` is the same per instance |
| heap KB / inst | JS heap retained per instance: heap after a forced full GC, minus the heap before mounting |
| after unmount KB / inst | what is still retained after unmounting. Expect about 0; a leak shows here |
| leaked nodes / inst | DOM nodes still alive after unmount and GC. Expect 0 |
| DOM nodes, components, listeners | per instance, mounted |
| interaction ms | the family's main interaction on one of the N instances (click, key press, open) |

Popup families also get an open / close table: trigger event to content in the DOM and laid out,
the same to painted, and Escape to content gone. Its "closed" columns repeat what one closed
instance costs, because that is the work a page pays for popups nobody opened.

**Collection scenario** (Listbox, Combobox, Select, Tree, RadioGroup, Tabs, ToggleGroup,
DropdownMenu): one instance with 1,000 and with 5,000 items.

| Column | Meaning |
|---|---|
| mount ms, heap KB / item | mounting the instance (popups: closed) |
| open ms | popups: trigger click to items in the DOM and laid out |
| ms / key | each of 50 presses of the navigation key (ArrowDown, or ArrowRight for Tabs and ToggleGroup), from keydown to the highlight or focus having moved |
| type ms | one typeahead character (Combobox: one character typed into the filter) |
| select ms | selecting an item in the middle of the list |
| updates / key, mounts / key | component re-renders and component mounts caused by one key press |
| qSA / key | `querySelectorAll` calls made by the library per key press |
| updates / type, updates / select | component re-renders for one typed character and for one selection |

The counts come from a second, untimed mount with a global mixin (`beforeUpdate`,
`beforeMount`) and a patched `querySelectorAll`, so the counters never touch the timed pass. A
second table names the four components that re-render most. A list where one key press
re-renders about two components scales; one where it re-renders a multiple of the item count
does not, and its `ms / key` grows with the list.

Statistics: each cell shows `median / p95 / stddev` over all samples (rounds × page loads, or
key presses × page loads). The JSON keeps every sample.

## Reading a comparison

`pnpm bench:compare a.json b.json` lists the metrics that moved beyond noise, largest first,
and a "spread" table: how far apart the two files are per metric class. Run on two results of
the same build, the spread table is the noise floor of the machine.

Measured noise floor (the baseline run twice on the same build, see `results/`):

<!-- noise-floor -->

The default thresholds follow from that: timings must move by more than 15%, more than twice
their standard deviation, and more than 0.1 ms. Heap must move by more than 2% and 0.1 KB.
Counts must differ by more than 1% and at least 0.5. Change them with `--time` and `--heap`.

Each results file records the machine, Chromium, Vue and Node versions, the commit, the 1-minute
load average at the start, its maximum during the run, and whether the Mac slept. `timings` is
`ok` only for a run that was gated (`--gate`) on a quiet machine and saw no sleep. `compare`
tells you to ignore the timing rows otherwise.

## Timing needs a quiet machine

- Pass `--gate 2` (1-minute load average below 2). The run waits up to `--gate-wait` minutes,
  then runs anyway and marks its timings `suspect`.
- On macOS the run holds a `caffeinate -dimsu` assertion. A Mac that naps (DarkWake) during an
  unattended run reads about three times slower. The run counts sleep and DarkWake entries in
  `pmset -g log` for its time window and marks the timings `suspect` if there are any.
- Close other browsers and builds. One bench at a time.

This is why the bench is **not wired into CI**: timings on shared runners are noise. Run it
locally before and after a performance change and paste the `compare` output into the PR.

## Adding a family

Add an entry to `FAMILIES` in `bench/src/families.js`: the template of one instance (`body`),
how many to mount (`n`) and, if it has one, the main interaction (`act`). The fixture component
is generated from the entry, and its reka-ui imports are derived from the tags in the template.
Add a `collection` block to include the family in the large-collection scenario. Then
`pnpm bench --family <Name> --runs 1` to check that it runs.

## Layout

- `src/families.js`: the family table. `src/data.js`: fixture data. `src/dom.js`: event helpers.
- `src/main.js`: the in-page driver (what is timed, and how).
- `scripts/bench.mjs`: the CLI. `gen.mjs` writes the fixtures, `build.mjs` builds the page,
  `run.mjs` drives Chromium, `stats.mjs` and `report.mjs` summarize.
- `scripts/compare.mjs`: `pnpm bench:compare`.
- `results/`: committed baselines.
