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

## `data-state`

Rewrites the v2 `data-state` values to the [v3 vocabulary](https://reka-ui.com/docs/guides/migration-v3) in Tailwind variants (`data-[state=…]:`, `group-data-[state=…]:`, `peer-data-[state=…]:`) and CSS attribute selectors (`[data-state=…]`, `[data-state='…']`, `[data-state="…"]`):

| v2 | v3 |
| --- | --- |
| `on` / `off` | `checked` / `unchecked` |
| `visible` / `hidden` | `open` / `closed` |
| `expanded` / `collapsed` | `open` / `closed` |
| `instant-open` | `open` |
| `delayed-open` | `open` + `data-delayed` (`data-[state=open]:data-[delayed]:` / `[data-state=open][data-delayed]`) |
| `active` / `inactive` | `checked` / `unchecked` — only when the file is clearly about Tabs, TagsInput or Rating |

Everything else — `data-[side=…]`, `data-orientation`, values already on `open` / `closed` / `checked` / `unchecked` — is left as is, and running the codemod twice makes no further changes.

### Warnings

Two situations cannot be decided mechanically. The codemod leaves the source untouched and prints a `file:line: message` warning for each so you can finish the migration by hand:

- `ambiguous data-state "active": rewrite to "checked" for Tabs/TagsInput/Rating, keep for Stepper/Splitter` — Tabs, TagsInput and Rating moved from `active` / `inactive` to `checked` / `unchecked`, but Stepper still emits `active` / `inactive` / `completed` and the Splitter resize handle still emits `inactive`. The decision is made per file from the component names it mentions: a file that mentions `Tabs`, `TagsInput` or `Rating` (and not `Stepper` or `SplitterResizeHandle`) is rewritten, a file that only mentions `Stepper` or `SplitterResizeHandle` is kept, and a file that mentions both or neither gets this warning.
- `"[data-state]" is now always present, so a presence-only selector matches every part; target the explicit value instead` — a bare `[data-state]` or `:not([data-state])` selector relied on the attribute being present or absent (for example a `RatingItemIndicator` that was active, or a non-collapsible `SplitterPanel`). In v3 both values are always emitted, so `[data-state]` matches every part and `:not([data-state])` matches nothing; target `checked` / `unchecked` or `open` / `closed` instead.
