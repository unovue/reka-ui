# @reka-ui/codemod

Best-effort codemods for migrating a codebase between Reka UI major versions.

```sh
npx @reka-ui/codemod data-state ./src
```

Run with `--dry-run` first to see what would change without writing anything, and use `--ext` to change the file extensions that are processed (default: `vue,css,scss,ts,tsx,js,jsx,html,md`). `node_modules`, `dist`, `.git`, `.nuxt`, `.output` and `coverage` are always skipped, including when a supplied path is or sits inside one of them.

```sh
npx @reka-ui/codemod data-state ./src --dry-run
npx @reka-ui/codemod data-state ./src ./docs --ext vue,css
```

The package is versioned and published in lockstep with `reka-ui`, so pin the major you are migrating to (`npx @reka-ui/codemod@3 …`) to get the codemods written for that release. A pull request's build can be tried before it is published with `npx https://pkg.pr.new/@reka-ui/codemod@<pr-number> data-state ./src`.

## `data-state`

Rewrites the v2 `data-state` values to the [v3 vocabulary](https://reka-ui.com/docs/guides/migration-v3) in Tailwind variants (`data-[state=…]:`, `group-data-[state=…]:`, `peer-data-[state=…]:`) and CSS attribute selectors (`[data-state=…]`, `[data-state='…']`, `[data-state="…"]`):

| v2 | v3 |
| --- | --- |
| `on` / `off` | `checked` / `unchecked` |
| `visible` / `hidden` | `open` / `closed` |
| `expanded` / `collapsed` | `open` / `closed` |
| `instant-open` | `open` |
| `delayed-open` | `open` + `data-delayed` (`data-[state=open]:data-[delayed]:` / `[data-state=open][data-delayed]`) |
| `active` / `inactive` | `checked` / `unchecked` when the file is clearly about Tabs, TagsInput or Rating; `current` / `upcoming` when it is clearly about Stepper; kept when it is clearly about the Splitter resize handle |

Everything else — `data-[side=…]`, `data-orientation`, values already on `open` / `closed` / `checked` / `unchecked` — is left as is, and running the codemod twice makes no further changes.

### Warnings

Two situations cannot be decided mechanically. The codemod leaves the source untouched and prints a `file:line: message` warning for each so you can finish the migration by hand:

- `ambiguous data-state "active": rewrite to "checked" for Tabs/TagsInput/Rating, rewrite to "current" for Stepper, keep for SplitterResizeHandle` — `active` / `inactive` now mean three different things: Tabs, TagsInput and Rating moved to `checked` / `unchecked`, Stepper moved to `current` / `upcoming` (keeping `completed`), and the Splitter resize handle still emits `inactive`. The decision is made once per file from the component names it mentions: a file that mentions only `Tabs`, `TagsInput` or `Rating` is rewritten to `checked` / `unchecked`, a file that mentions only `Stepper` is rewritten to `current` / `upcoming`, a file that mentions only `SplitterResizeHandle` is kept, and a file that mentions more than one of those groups, or none of them, gets this warning (with `"inactive"` / `"unchecked"` / `"upcoming"` for the `inactive` value).
- `"[data-state]" is now always present, so a presence-only selector matches every part; target the explicit value instead` — a bare `[data-state]` or `:not([data-state])` selector relied on the attribute being present or absent (for example a `RatingItemIndicator` that was active, or a non-collapsible `SplitterPanel`). In v3 both values are always emitted, so `[data-state]` matches every part and `:not([data-state])` matches nothing; target `checked` / `unchecked` or `open` / `closed` instead.
