# Changelog

All notable changes to this extension are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Autocomplete for fastField and pdoParser tags after `#`: resource fields
  (`[[#15.pagetitle]]`), the TV and property prefixes (`[[#15.tv.name]]`,
  `[[#15.properties.key]]`) and the PHP superglobals (`[[!#GET.key]]`, `POST`,
  `REQUEST`, `SERVER`, `FILES`, `COOKIE`, `SESSION`).
- Block name suggestions in Fenom. Names are collected from `{block '…'}` in the
  current file and in templates reached through `{extends}` and `{use}`, and are
  offered inside `{paste '…'}`, `{block '…'}` and `{$.block.…}`.

### Fixed

- `{continue}` is suggested inside `{foreach}`.
- The `{block}` tag is suggested without a preceding `{extends}`, which parent
  templates need.
- `@FILE` autocomplete works from the project root, so `vscode-modx.elementsPath`
  may be `/`, `.` or empty.
- `[[- … ]]` comments stop highlighting at the next `]]` rather than at the end
  of the line, and a tag inside a comment is no longer highlighted as code.

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

First published release.

[Unreleased]: https://github.com/GulomovCreative/vscode-modx/compare/4137011...main
[1.0.6]: https://github.com/GulomovCreative/vscode-modx/compare/11de72a...4137011
[1.0.5]: https://github.com/GulomovCreative/vscode-modx/compare/b1ff664...11de72a
[1.0.4]: https://github.com/GulomovCreative/vscode-modx/compare/f52c0df...b1ff664
[1.0.3]: https://github.com/GulomovCreative/vscode-modx/compare/1046d49...f52c0df
[1.0.2]: https://github.com/GulomovCreative/vscode-modx/commit/1046d49
