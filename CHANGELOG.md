# Changelog

All notable changes to this extension are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1]

### Fixed

- Suggestions and diagnostics read as English again instead of showing the
  internal key: `FetchIt.description` in place of the description, `reference`
  in place of the link, `diagnostic.unclosedBlock` in the Problems panel. The
  descriptions are stored under keys, and `vscode.l10n` treats the key it is
  given as the message itself — it looks the key up in the bundle for the
  display language and hands it back unchanged when there is none. English has
  no bundle at all: `bundle.l10n.json` exists for translators and is never
  loaded at runtime. Until 1.2.0 the extension loaded that file itself, so the
  keys resolved; moving to the editor's own localization removed the only
  source of English. The English dictionary is now compiled into the bundle and
  answers whenever the editor has no translation, which also covers a key the
  Russian bundle is missing.
- Building the package no longer takes the grammars from an outdated
  `node_modules`. The files in `languages/` are copies of what the grammar
  packages ship, and the sync script wrote whatever was installed: a publish
  run after `git pull` without `npm ci` rewrote a copy with the previous
  version of the package. That run happened to stop on a file the older
  version did not have yet — had the set of files matched, the release would
  have carried highlighting one version behind. The script now compares the
  installed versions with `package-lock.json` before it writes anything.

## [1.3.0]

### Added

- Structural problems in a template are reported in the Problems panel: a
  construct with no end — `[[`, `[[-`, `{`, `{*`, `{ignore}`, a backtick
  without its pair — and Fenom block tags that do not pair up, including a
  closing tag that closes the wrong block and `{else}` or `{case}` outside the
  block they belong to. `{set $x = 1}` and `{var $x = 1}` are instructions, not
  blocks, and are left alone.
- `vscode-modx.diagnostics` chooses how much is reported: `off`, `unclosed`
  (the default) or `all`. `all` adds unpaired HTML elements, which is worth
  having on a whole page and wrong on a chunk that opens an element another
  chunk closes — that is why it is not the default.

### Changed

- The MODX language configuration comes from its grammar package, as the Fenom
  one already did. Typing `[[` closes it with `]]`, `[[…]]` works as a pair to
  select and surround with, and `<`, `>` and `<!-- -->` are understood the way
  they are in HTML.
- MODX re-indents correctly while a tag is typed. The rules it used before
  outdented **every** line holding a tag that opened and closed on itself: in a
  template where half the lines are `[[*pagetitle]]`, typing walked the
  indentation left a level at a time. The rules now come from the grammar
  package and are written against the real shapes — a multi-line snippet call
  indents, a self-contained tag does not move the line, `[[- … ]]` is a comment
  rather than an opening, and `]]` inside a value in backticks closes nothing.
- Folding in MODX follows `<!-- #region -->` and `<!-- #endregion -->` instead
  of bare `[[` and `]]` at the start of a line. The old markers are per-line —
  a line is either a start or an end — so `[[*pagetitle]]` opened a region that
  never closed.

### Fixed

- A forgotten backtick in a property value no longer colours the rest of the
  file as a string: the value ends at a blank line as well as at its closing
  backtick.

## [1.2.0]

### Added

- The extension runs in the browser: github.dev, vscode.dev and any other
  virtual workspace. It ships a second bundle built for a web extension host,
  and `capabilities.virtualWorkspaces` no longer warns about limited support.

### Changed

- Paths to template files are built as URIs from the workspace folder rather
  than as strings through `node:path` and `Uri.file`. The scheme is inherited,
  so `@FILE` completion, Go to Definition and block names from `{extends}` will
  work in a virtual workspace, where files live under `vscode-vfs:` and there is
  no disk to address.
- Descriptions come from the editor's own `vscode.l10n` instead of a bundle the
  extension read from disk itself. One step towards running in a virtual
  workspace, where there is no disk to read: `node:fs` ran at module load, so
  the extension could not even start in a browser host.
- Fenom re-indents while a tag is typed again. The grammar package declares
  indentation rules once more, and they now cover every block tag Fenom closes:
  `{var}`, `{set}` and `{add}` in their block form but not when they carry an
  assignment, the `{case}` and `{default}` branch markers, and a tag that opens
  and closes on one line no longer shifts the line under it.

### Fixed

- A tag that opens and closes on one line no longer moves everything after it.
  `srcset="{$a}{if $b}, {$c} 2x{/if}"` changes no nesting, but the `{if}` was
  counted as an open block that nothing ever closed, so the next closing
  construct took its level — in a real template `{/block}` ended up two levels
  deep where there was no nesting left at all.
- Formatting no longer walks a template left. An HTML tag written over several
  lines — normal with Tailwind — matched none of the per-line patterns, so the
  nesting never grew on it while the closing tag still shrank it: every such tag
  cost one level, and by the end of the file `{/block}` sat four tabs deep.
  Attribute lines are now indented as a continuation, and a closing `>` on a
  line of its own comes back to the level of the tag it opened.
- Suggestions typed between two tags on the same line behave as they do outside
  a tag: a system setting completes to `[[++name]]` instead of a bare name, and
  a chunk is offered at all. Where a construct ends was decided by a regular
  expression that searched the current line and did not stop at `]]`, so
  `[[a]] … [[b]]` read as one tag with the cursor inside it.
- The Marketplace badges in the readme render again. shields.io retired its
  Visual Studio Marketplace badges, and all three showed as "retired badge" on
  the Marketplace page itself.

## [1.1.0]

### Added

- Autocomplete for fastField and pdoParser tags after `#`: resource fields
  (`[[#15.pagetitle]]`), the TV and property prefixes (`[[#15.tv.name]]`,
  `[[#15.properties.key]]`) and the PHP superglobals (`[[!#GET.key]]`, `POST`,
  `REQUEST`, `SERVER`, `FILES`, `COOKIE`, `SESSION`).
- Block name suggestions in Fenom. Names are collected from `{block '…'}` in the
  current file and in templates reached through `{extends}` and `{use}`, and are
  offered inside `{paste '…'}`, `{block '…'}` and `{$.block.…}`.
- `Format Document` and `Format Selection` for both languages. Only leading
  whitespace changes, and comments, `{ignore}`, `<pre>`, `<textarea>`, `<script>`
  and `<style>` are left untouched.

### Changed

- Grammars and the Fenom language configuration are taken from their own
  packages, so a grammar fix reaches the extension with a version bump.
- Fenom no longer re-indents while a tag is typed. The language configuration
  now comes from the grammar package, and its current version declares no
  indentation rules; `Format Document` and `Format Selection` re-indent instead.
- Setting descriptions render as markdown instead of raw HTML, which the
  suggestion popup showed as tags.
- The extension is bundled into `dist/` without `lodash` and `json5`, and the
  screenshots are requantised: the package went from 4.77 MB to 1.28 MB.

### Fixed

- `{continue}` is suggested inside `{foreach}`.
- The `{block}` tag is suggested without a preceding `{extends}`, which parent
  templates need.
- `@FILE` autocomplete works from the project root, so `vscode-modx.elementsPath`
  may be `/`, `.` or empty.
- `[[- … ]]` comments stop highlighting at the next `]]` rather than at the end
  of the line, and a tag inside a comment is no longer highlighted as code.
- `.html` files keep the built-in HTML mode, so `Open with Live Server`, Emmet
  and everything else keyed on `resourceLangId == html` stays available. Point
  `files.associations` at the templates you do store as `.html`.
- Russian descriptions of the system settings were shifted by one key: the name
  and the explanation shown for a setting belonged to its neighbour.
- Fenom suggestions keep the surrounding tags in order after an unpaired
  closing tag, so `{else}` and `{continue}` are still offered further down the
  file.
- Snippet props are suggested inside `$_modx->runSnippet()`.
- Method argument tabstops start at the first argument instead of leaving the
  cursor at the end of the call.
- `FormIt` no longer lists `redirectTo` twice.
- The binding under the cursor is parsed rather than the first one on the line,
  so `@FILE` paths complete in a tag that holds several of them.
- Suggestions no longer leak between documents or between requests in flight at
  the same time.

## [1.0.6]

### Added

- Declared support for virtual workspaces.

### Changed

- README: troubleshooting for Emmet and TailwindCSS, and a licence scan badge.

## [1.0.5]

### Added

- `modx` and `fenom` registered as HTML language participants, which brings HTML
  completion, hover and auto-insert into templates.
- `vscode.html-language-features` is activated on startup so those features are
  available immediately.

## [1.0.4]

### Fixed

- The extension works with remote files.

## [1.0.3]

### Fixed

- Snippet detection.

## [1.0.2]

Earliest release this changelog covers. `1.0.1` reached the Marketplace the
same day from a working tree that was never committed, so there is nothing here
to describe it with and no commit to tag.

### Added

- `modx` and `fenom` as separate languages for `.tpl`, each with its own grammar
  and language configuration.
- MODX autocomplete: chunk tags, resource fields and placeholders, system
  settings, output filters, snippets and their props.
- Fenom autocomplete: tags and their closing, tag arguments and options,
  variables, modifiers, snippets, their methods and props, and `{foreach}`
  arguments.
- `@FILE` binding paths in both languages: completion and Go to Definition.
- Snippet schemas for pdoTools, miniShop2, FormIt and FetchIt.
- The `vscode-modx.elementsPath` setting.

[Unreleased]: https://github.com/GulomovCreative/vscode-modx/compare/v1.3.1...master
[1.3.1]: https://github.com/GulomovCreative/vscode-modx/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/GulomovCreative/vscode-modx/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/GulomovCreative/vscode-modx/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/GulomovCreative/vscode-modx/releases/tag/v1.0.2
