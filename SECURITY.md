# Security

## Supported versions

Fixes go into the latest version published on the Marketplace. There are no
maintained older branches.

## Reporting a vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/GulomovCreative/vscode-modx/security/advisories/new),
or by email to gulomovcreative@gmail.com. Please do not open a public issue for
something exploitable.

Useful in a report: what the extension does that it should not, the template or
workspace layout that triggers it, and the versions of the extension and of VS
Code.

## What this extension does

Worth knowing when judging whether something is a vulnerability:

- It reads files. `@FILE` completion lists files under
  `vscode-modx.elementsPath`, resolved against the workspace root. Go to
  Definition opens the path the template names, so a path written with `..`
  points where it says — the same as opening it from the editor would.
- It executes nothing. No shell commands, no evaluation of template contents,
  no code from the workspace is loaded.
- It sends nothing. There is no telemetry and no network access at runtime.
- Suggestions come from schemas inside the extension, and from the open file
  and the templates it links to through `{extends}` and `{use}`.

Anything leaving the machine, or a file being read that no open template names,
would be a bug worth reporting.
