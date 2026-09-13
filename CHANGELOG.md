# Changelog

All notable changes to this extension are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/GulomovCreative/vscode-modx/compare/v1.1.0...master
[1.1.0]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/GulomovCreative/vscode-modx/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/GulomovCreative/vscode-modx/releases/tag/v1.0.2
