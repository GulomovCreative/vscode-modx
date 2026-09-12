# Contributing

## Getting started

```sh
npm ci
npm run esbuild      # bundle with a sourcemap
```

Press `F5` in VS Code to open a second window with the extension loaded.
`.vscode/launch.json` builds first, so the window always runs the current
sources.

## Checks

```sh
npm run lint
npm run typecheck
npm test
```

CI runs the same three plus the bundle build, and compares the key sets of the
two l10n bundles. Run them before opening a pull request; a failing check is
faster to find locally than in a workflow log.

## Layout

| | |
| --- | --- |
| `src/providers/modx/` | completion inside `[[…]]` |
| `src/providers/fenom/` | completion inside `{…}` |
| `src/providers/file/` | `@FILE` paths — completion and Go to Definition |
| `src/providers/format.ts` | `Format Document` and `Format Selection` |
| `src/scanner.ts` | the single tokenizer both languages parse through |
| `src/schemas/` | snippets, their props, modifiers, system settings |
| `languages/` | grammars, copied from their packages — see below |
| `l10n/` | descriptions shown in the suggestion popup |

## Adding a snippet or a prop

Schemas live in `src/schemas/snippets/`. A prop needs a name, a type and a
description; the description is a key into `l10n/bundle.l10n.json`, and the
Russian bundle must gain the same key or CI fails.

Take the text from the documentation of the extra itself rather than writing it
anew — a user comparing the popup with the docs should see the same words.

## Grammars

`languages/*.tmLanguage.json` and `languages/fenom-configuration.json` are
copies, not sources. They come from
[modx-tmlanguage](https://github.com/GulomovCreative/modx-tmlanguage) and
[fenom-tmlanguage](https://github.com/GulomovCreative/fenom-tmlanguage), and
`npm run sync-grammars` refreshes them. Editing the copy is pointless: the next
sync overwrites it, and `npm run sync-grammars -- --check` flags the difference.

Highlighting problems belong in those repositories.

## Tests

`test/` runs the real providers against a stubbed editor. `test/helpers.js`
bundles `src/extension.ts` with esbuild, calls `activate()`, and collects what
was registered, so a test asks a provider for completions the way VS Code does.

The cursor in a test template is written as `‸` (U+2038), because `|` is the
Fenom modifier operator.

```js
const variables = await getProvider({ language: 'fenom', triggerCharacters: ['$', '>', '.', "'", '"'] });
const items = await complete(variables, '{set $tpl = 1}\n{$‸}', 'fenom');

assert.ok(labels(items).includes('$tpl'));
```

## Commits and pull requests

One change per pull request. The commit subject says what changed in the
imperative — `fix(fenom): Keep parent tag order after an unpaired closing tag` —
and the body says why, which is the part that is hard to recover later.

Branches follow the subject: `fix/`, `feat/`, `perf/`, `refactor/`, `docs/`,
`chore/`, `test/`, `ci/`.

Every user-visible change gets a line in `CHANGELOG.md` under `Unreleased`,
written for someone who uses the extension rather than for someone who reads
the diff.
